import type { FastifyInstance } from "fastify";
import { prisma } from "@quickstart-ai/db";
import { AppError, PLAN_LIMITS, type PlanTier, voiceTranscribeSchema } from "@quickstart-ai/shared";
import { requireClient } from "../auth.js";
import { transcribeAudio, VoiceTranscriptionError } from "../groq.js";

export async function voiceRoutes(app: FastifyInstance) {
  app.post("/api/v1/voice/transcribe", async (req) => {
    await requireClient(req);
    const body = voiceTranscribeSchema.parse(req.body);

    const project = await prisma.project.findUnique({ where: { id: req.projectId! } });
    if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");

    const planKey = (project.plan ?? "free") as PlanTier;
    const dailyLimit = PLAN_LIMITS[planKey].voiceTranscriptionsPerDay;
    if (dailyLimit <= 0) {
      throw new AppError(
        "Voice mode isn't available on the free plan. Upgrade to enable it.",
        403,
        "PLAN_UPGRADE_REQUIRED",
      );
    }

    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const todayCount = await prisma.usageEvent.count({
      where: { projectId: project.id, kind: "voice_transcribe", createdAt: { gte: startOfToday } },
    });
    if (todayCount >= dailyLimit) {
      throw new AppError(
        `Daily limit of ${dailyLimit} voice messages reached for your ${planKey} plan. Upgrade or wait until tomorrow.`,
        429,
        "PLAN_LIMIT_EXCEEDED",
      );
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
