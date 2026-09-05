import type { FastifyInstance, FastifyRequest } from "fastify";
import { isValidSessionId, prisma } from "@quickstart-ai/db";
import {
  AppError,
  NotFoundError,
  PLAN_LIMITS,
  type PlanTier,
  voiceSessionCreateSchema,
  voiceSessionEndSchema,
  voiceSessionHeartbeatSchema,
  voiceToolExecuteSchema,
  voiceTranscriptSchema,
  voiceTranscriptBatchSchema,
} from "@quickstart-ai/shared";
import { requireClient } from "../auth.js";
import { requireAuth } from "../auth.js";
import { requireProjectAccess } from "../project-access.js";
import { env } from "../env.js";
import {
  checkVoiceRealtimeGate,
  getVoiceMonthStart,
  voiceMinutesUsedThisMonth,
} from "../voice-gate.js";
import { GeminiTokenError, mintGeminiEphemeralToken, probeGeminiVoiceHealth } from "./gemini-token.js";
import { buildGeminiLiveConnectConfig } from "./instructions.js";
import {
  countActiveVoiceSessions,
  endVoiceSession,
  getResumptionHandle,
  getVoiceSession,
  saveVoiceSession,
  setResumptionHandle,
  touchVoiceSession,
} from "./session-store.js";
import { executeVoiceToolCall } from "./tool-bridge.js";
import { persistVoiceTranscriptTurns } from "./transcript-persist.js";

async function requireVoiceSession(req: FastifyRequest, voiceSessionId: string) {
  const state = await getVoiceSession(voiceSessionId);
  if (!state || state.projectId !== req.projectId) {
    throw new NotFoundError("Voice session not found");
  }
  if (state.status === "ended" || state.status === "failed") {
    throw new AppError("Voice session has ended", 410, "VOICE_SESSION_ENDED");
  }
  return state;
}

async function monthVoiceMinutes(projectId: string): Promise<number> {
  const start = getVoiceMonthStart();
  const rows = await prisma.usageEvent.findMany({
    where: {
      projectId,
      kind: "voice_realtime_minute",
      createdAt: { gte: start },
    },
    select: { units: true },
  });
  return voiceMinutesUsedThisMonth(rows);
}

export async function registerVoiceRealtimeRoutes(app: FastifyInstance) {
  app.get("/api/v1/voice/health", async () => {
    const gemini = await probeGeminiVoiceHealth();
    return {
      success: true,
      provider: env.voiceProvider,
      realtimeEnabled: env.voiceRealtimeEnabled,
      gemini,
    };
  });

  /** Dashboard: voice usage for the current UTC month. */
  app.get("/api/v1/projects/:id/voice/usage", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await requireProjectAccess(id, req.user!.id, { minRole: "admin" });
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundError("Project not found");

    const planKey = (project.plan ?? "free") as PlanTier;
    const minutesUsed = await monthVoiceMinutes(id);
    const activeSessions = await countActiveVoiceSessions(id);

    return {
      success: true,
      usage: {
        minutesUsed,
        minutesLimit: PLAN_LIMITS[planKey].voiceMinutesPerMonth,
        activeSessions,
        concurrentLimit: PLAN_LIMITS[planKey].maxConcurrentVoiceSessions,
      },
    };
  });

  app.post("/api/v1/voice/session", async (req) => {
    await requireClient(req);
    if (!env.voiceRealtimeEnabled) {
      throw new AppError("Realtime voice is disabled on this server.", 503, "VOICE_DISABLED");
    }

    const body = voiceSessionCreateSchema.parse(req.body ?? {});
    const project = await prisma.project.findUnique({ where: { id: req.projectId! } });
    if (!project) throw new NotFoundError("Project not found");

    const planKey = (project.plan ?? "free") as PlanTier;
    const [minutesUsed, activeSessions] = await Promise.all([
      monthVoiceMinutes(project.id),
      countActiveVoiceSessions(project.id),
    ]);

    const gate = checkVoiceRealtimeGate(
      planKey,
      minutesUsed,
      activeSessions,
      project.voiceEnabled,
    );
    if (!gate.allowed) {
      const status =
        gate.code === "PLAN_UPGRADE_REQUIRED" || gate.code === "VOICE_DISABLED" ? 403 : 429;
      throw new AppError(gate.reason, status, gate.code);
    }

    const resumptionHandle = body.resumptionHandle;

    let tokenResult;
    try {
      tokenResult = await mintGeminiEphemeralToken(project, { resumptionHandle });
    } catch (err) {
      if (err instanceof GeminiTokenError) {
        req.log.error({ err }, "gemini ephemeral token failed");
        throw new AppError(err.message, 502, "VOICE_TOKEN_FAILED");
      }
      throw err;
    }

    const voiceSessionId = crypto.randomUUID();
    const now = new Date();

    const record = await prisma.voiceSessionRecord.create({
      data: {
        id: voiceSessionId,
        projectId: project.id,
        chatSessionId: body.chatSessionId,
        provider: project.voiceProvider,
        mode: "realtime",
        status: "starting",
        startedAt: now,
        meta: { model: tokenResult.model },
      },
    });

    await saveVoiceSession({
      voiceSessionId,
      projectId: project.id,
      chatSessionId: body.chatSessionId,
      provider: project.voiceProvider,
      status: "starting",
      startedAt: now.toISOString(),
      lastHeartbeatAt: now.toISOString(),
    });

    return {
      success: true,
      session: {
        voiceSessionId: record.id,
        chatSessionId: body.chatSessionId ?? null,
        provider: "gemini_live",
        ephemeralToken: tokenResult.ephemeralToken,
        model: tokenResult.model,
        expiresAt: tokenResult.expiresAt,
        fallbackMode: project.voiceFallbackMode,
        connect: {
          // Client uses @google/genai live.connect with ephemeralToken as apiKey
          useEphemeralToken: true,
          responseModalities: ["AUDIO"],
          language: project.voiceLanguage,
          voiceName: project.voiceName,
        },
        tools: buildGeminiLiveConnectConfig(project).tools ?? [],
      },
    };
  });

  app.post("/api/v1/voice/session/:voiceSessionId/heartbeat", async (req) => {
    await requireClient(req);
    const { voiceSessionId } = req.params as { voiceSessionId: string };
    const body = voiceSessionHeartbeatSchema.parse(req.body ?? {});

    const state = await requireVoiceSession(req, voiceSessionId);
    const updated = await touchVoiceSession(voiceSessionId, { status: "live" });

    if (body.resumptionHandle) {
      await setResumptionHandle(voiceSessionId, body.resumptionHandle);
    }

    if (updated && state.status === "starting") {
      await prisma.voiceSessionRecord.update({
        where: { id: voiceSessionId },
        data: { status: "live" },
      });
    }

    return { success: true, status: updated?.status ?? "live" };
  });

  app.post("/api/v1/voice/session/:voiceSessionId/end", async (req) => {
    await requireClient(req);
    const { voiceSessionId } = req.params as { voiceSessionId: string };
    const body = voiceSessionEndSchema.parse(req.body ?? {});

    const existing = await getVoiceSession(voiceSessionId);
    if (!existing || existing.projectId !== req.projectId) {
      throw new NotFoundError("Voice session not found");
    }
    if (existing.status === "ended" || existing.status === "failed") {
      return {
        success: true,
        durationSec: 0,
        resumptionHandle: await getResumptionHandle(voiceSessionId),
        status: existing.status,
      };
    }

    const state = existing;
    await endVoiceSession(voiceSessionId, body.reason === "error" ? "failed" : "ended");

    const startedAt = new Date(state.startedAt);
    const durationSec = Math.max(1, Math.ceil((Date.now() - startedAt.getTime()) / 1000));
    const billableMinutes = Math.max(1, Math.ceil(durationSec / 60));

    await prisma.voiceSessionRecord.update({
      where: { id: voiceSessionId },
      data: {
        status: body.reason === "error" ? "failed" : "ended",
        endedAt: new Date(),
        durationSec,
        errorCode: body.reason === "error" ? "client_error" : null,
      },
    });

    await prisma.usageEvent.create({
      data: {
        projectId: state.projectId,
        kind: "voice_realtime_minute",
        units: billableMinutes,
        meta: { voiceSessionId, durationSec, reason: body.reason ?? "user" },
      },
    });

    const resumptionHandle = await getResumptionHandle(voiceSessionId);

    return {
      success: true,
      durationSec,
      resumptionHandle,
      status: body.reason === "error" ? "failed" : "ended",
    };
  });

  /** Bridge Gemini Live tool calls to QuickStart RAG + handoff + lead capture. */
  app.post("/api/v1/voice/tools/execute", async (req) => {
    await requireClient(req);
    const body = voiceToolExecuteSchema.parse(req.body ?? {});
    await requireVoiceSession(req, body.voiceSessionId);

    const { output, actions } = await executeVoiceToolCall({
      projectId: req.projectId!,
      voiceSessionId: body.voiceSessionId,
      toolName: body.toolName,
      toolCallId: body.toolCallId,
      args: body.args ?? {},
    });

    return { success: true, toolCallId: body.toolCallId, output, actions };
  });

  /** Persist a finalized voice turn to the linked chat session for agent inbox history. */
  app.post("/api/v1/voice/transcript", async (req) => {
    await requireClient(req);
    const body = voiceTranscriptSchema.parse(req.body ?? {});
    if (!isValidSessionId(body.chatSessionId)) {
      throw new NotFoundError("Session not found");
    }

    const { saved } = await persistVoiceTranscriptTurns({
      projectId: req.projectId!,
      chatSessionId: body.chatSessionId,
      turns: [
        {
          role: body.role,
          content: body.content,
          clientTurnId: body.clientTurnId,
          voiceSessionId: body.voiceSessionId,
        },
      ],
    });

    return { success: true, saved };
  });

  /** Persist multiple voice turns in one request (e.g. end-of-session flush). */
  app.post("/api/v1/voice/transcript/batch", async (req) => {
    await requireClient(req);
    const body = voiceTranscriptBatchSchema.parse(req.body ?? {});
    if (!isValidSessionId(body.chatSessionId)) {
      throw new NotFoundError("Session not found");
    }

    const { saved } = await persistVoiceTranscriptTurns({
      projectId: req.projectId!,
      chatSessionId: body.chatSessionId,
      turns: body.turns.map((turn) => ({
        role: turn.role,
        content: turn.content,
        clientTurnId: turn.clientTurnId,
        voiceSessionId: body.voiceSessionId,
      })),
    });

    return { success: true, saved };
  });
}
