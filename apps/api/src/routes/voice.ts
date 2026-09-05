import type { FastifyInstance } from "fastify";
import { prisma } from "@quickstart-ai/db";
import { AppError, type PlanTier, voiceTranscribeSchema } from "@quickstart-ai/shared";
import { requireClient } from "../auth.js";
import { transcribeAudio, VoiceTranscriptionError } from "../groq.js";
import { checkVoiceTranscribeGate } from "../voice-gate.js";
import { registerVoiceRealtimeRoutes } from "../voice/routes.js";

export async function voiceRoutes(app: FastifyInstance) {
  await registerVoiceRealtimeRoutes(app);

  app.post("/api/v1/voice/transcribe", async (req) => {
    await requireClient(req);
    const body = voiceTranscribeSchema.parse(req.body);

    const project = await prisma.project.findUnique({ where: { id: req.projectId! } });
    if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");

    const planKey = (project.plan ?? "free") as PlanTier;
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const todayCount = await prisma.usageEvent.count({
      where: { projectId: project.id, kind: "voice_transcribe", createdAt: { gte: startOfToday } },
    });

    const gate = checkVoiceTranscribeGate(planKey, todayCount);
    if (!gate.allowed) {
      const status = gate.code === "PLAN_UPGRADE_REQUIRED" ? 403 : 429;
      throw new AppError(gate.reason, status, gate.code);
    }

    let text: string;
    try {
      const buffer = Buffer.from(body.audioBase64, "base64");
      text = await transcribeAudio(buffer, body.mimeType);
    } catch (err) {
      if (err instanceof VoiceTranscriptionError) {
        throw new AppError(err.message, 502, "VOICE_TRANSCRIBE_FAILED");
      }
      req.log.error({ err }, "voice transcription failed");
      throw new AppError("Could not transcribe audio. Please try again.", 502, "VOICE_TRANSCRIBE_FAILED");
    }

    if (!text) {
      throw new AppError("Couldn't hear anything in that recording. Please try again.", 422, "VOICE_EMPTY");
    }

    await prisma.usageEvent.create({
      data: { projectId: project.id, kind: "voice_transcribe", units: 1, meta: { sessionId: body.sessionId } },
    });

    return { success: true, text };
  });
}
