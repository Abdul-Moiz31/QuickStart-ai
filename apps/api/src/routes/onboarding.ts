import type { FastifyInstance } from "fastify";
import { prisma } from "@quickstart-ai/db";
import {
  AppError,
  classifyKnowledgeDoc,
  extractQaFromOnboardingDoc,
  onboardingBusinessSchema,
  onboardingCompleteSchema,
  parseBusinessProfileExtras,
  rebuildOnboardingDocContent,
  updateBusinessProfileSchema,
} from "@quickstart-ai/shared";
import { requireAuth } from "../auth.js";
import {
  generateClientId,
  generateClientSecret,
  hashSecret,
} from "../credentials.js";
import { env } from "../env.js";
import { Queue } from "bullmq";
import { QUEUE_NAMES, type OnboardingScanResult } from "@quickstart-ai/shared";

function getIngestQueue() {
  return new Queue(QUEUE_NAMES.INGEST, {
    connection: { url: env.redisUrl },
  });
}

function getOnboardingScanQueue() {
  return new Queue(QUEUE_NAMES.ONBOARDING_SCAN, {
    connection: { url: env.redisUrl },
  });
}

export async function onboardingRoutes(app: FastifyInstance) {
  app.get("/api/v1/onboarding", async (req) => {
    await requireAuth(req);
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        onboardingCompleted: true,
        businessName: true,
        businessWebsite: true,
        businessIndustry: true,
        businessDescription: true,
        onboardingQuestions: true,
        onboardingAnswers: true,
      },
    });
    if (!user) throw new AppError("User not found", 404);

    const project = await prisma.project.findFirst({
      where: { ownerId: req.user!.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    });

    let businessLocation: string | undefined;
    let supportEmail: string | undefined;
    let onboardingDocId: string | undefined;

    if (project) {
      const docs = await prisma.knowledgeDocument.findMany({
        where: { projectId: project.id },
        select: { id: true, title: true, sourceType: true, rawContent: true },
      });
      const onboardingDoc = docs.find((d) => classifyKnowledgeDoc(d) === "onboarding");
      if (onboardingDoc) {
        onboardingDocId = onboardingDoc.id;
        const extras = parseBusinessProfileExtras(onboardingDoc.rawContent);
        businessLocation = extras.businessLocation;
        supportEmail = extras.supportEmail;
      }
    }

    return {
      success: true,
      onboarding: {
        ...user,
        businessLocation,
        supportEmail,
        defaultProjectId: project?.id ?? null,
        defaultProjectName: project?.name ?? null,
        onboardingDocId: onboardingDocId ?? null,
      },
    };
  });

  app.patch("/api/v1/onboarding/business", async (req) => {
    await requireAuth(req);
    const patch = updateBusinessProfileSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError("User not found", 404);

    const project = await prisma.project.findFirst({
      where: { ownerId: req.user!.id },
      orderBy: { createdAt: "asc" },
    });

    let businessLocation = patch.businessLocation;
    let supportEmail = patch.supportEmail;
    let onboardingDoc: { id: string; rawContent: string } | null = null;

    if (project) {
      const docs = await prisma.knowledgeDocument.findMany({
        where: { projectId: project.id },
        select: { id: true, title: true, sourceType: true, rawContent: true },
      });
      const found = docs.find((d) => classifyKnowledgeDoc(d) === "onboarding");
      if (found) {
        onboardingDoc = { id: found.id, rawContent: found.rawContent };
        const extras = parseBusinessProfileExtras(found.rawContent);
        businessLocation ??= extras.businessLocation;
        supportEmail ??= extras.supportEmail;
      }
    }

    const merged = {
      businessName: patch.businessName ?? user.businessName ?? "",
      businessWebsite: patch.businessWebsite ?? user.businessWebsite ?? undefined,
      businessIndustry: patch.businessIndustry ?? user.businessIndustry ?? "",
      businessDescription: patch.businessDescription ?? user.businessDescription ?? "",
      businessLocation,
      supportEmail,
    };

    if (!merged.businessName || !merged.businessIndustry || !merged.businessDescription) {
      throw new AppError(
        "businessName, businessIndustry, and businessDescription must be set before partial updates",
        400,
      );
    }

    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        businessName: merged.businessName,
        businessWebsite: merged.businessWebsite || null,
        businessIndustry: merged.businessIndustry,
        businessDescription: merged.businessDescription,
      },
    });

    if (project) {
      const systemPrompt = `You are the support chatbot for ${merged.businessName} (${merged.businessIndustry}).
Website: ${merged.businessWebsite || "n/a"}
About: ${merged.businessDescription}
Answer only from the business knowledge provided. Be clear, helpful, and brief (widget-sized replies).`;

      await prisma.project.update({
        where: { id: project.id },
        data: {
          category: merged.businessIndustry,
          systemPrompt,
          description: merged.businessDescription.slice(0, 500),
        },
      });
    }

    if (onboardingDoc && project) {
      const qaPairs = extractQaFromOnboardingDoc(onboardingDoc.rawContent);
      const rawContent = rebuildOnboardingDocContent(merged, qaPairs);
      await prisma.knowledgeDocument.update({
        where: { id: onboardingDoc.id },
        data: { rawContent, status: "PENDING", error: null },
      });
      try {
        const queue = getIngestQueue();
        await queue.add(
          "ingest-document",
          { documentId: onboardingDoc.id, projectId: project.id },
          { removeOnComplete: 100, removeOnFail: 50, attempts: 3 },
        );
        await queue.close();
      } catch {
        // doc stays PENDING
      }
    }

    return {
      success: true,
      business: {
        ...merged,
        defaultProjectId: project?.id ?? null,
        onboardingDocId: onboardingDoc?.id ?? null,
      },
    };
  });

  app.post("/api/v1/onboarding/scan", async (req) => {
    await requireAuth(req);
    const body = onboardingBusinessSchema.parse(req.body);

    const project = await prisma.project.findFirst({
      where: { ownerId: req.user!.id },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    const queue = getOnboardingScanQueue();
    const job = await queue.add(
      "scan",
      {
        userId: req.user!.id,
        projectId: project?.id ?? null,
        businessName: body.businessName,
        businessWebsite: body.businessWebsite || undefined,
        businessIndustry: body.businessIndustry,
        businessDescription: body.businessDescription,
        businessLocation: body.businessLocation || undefined,
        supportEmail: body.supportEmail || undefined,
      },
      { removeOnComplete: 50, removeOnFail: 50, attempts: 1 },
    );
    await queue.close();

    return { success: true, jobId: job.id };
  });

  app.get("/api/v1/onboarding/scan/:jobId", async (req) => {
    await requireAuth(req);
    const { jobId } = req.params as { jobId: string };

    const queue = getOnboardingScanQueue();
    try {
      const job = await queue.getJob(jobId);
      if (!job || job.data?.userId !== req.user!.id) {
        throw new AppError("Scan not found", 404);
      }

      const state = await job.getState();
      const progress = (job.progress as { stage: string; pct: number } | number | null) ?? null;

      if (state === "completed") {
        const result = job.returnvalue as OnboardingScanResult;
        return { success: true, state, progress, result };
      }
      if (state === "failed") {
        return {
          success: true,
          state,
          progress,
          error: job.failedReason || "Website scan failed",
        };
      }
      return { success: true, state, progress };
    } finally {
      await queue.close();
    }
  });

  app.post("/api/v1/onboarding/complete", async (req) => {
    await requireAuth(req);
    const body = onboardingCompleteSchema.parse(req.body);
    if (body.questions.length !== body.answers.length) {
      throw new AppError("Each question needs an answer", 400);
    }

    const existing = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!existing) throw new AppError("User not found", 404);
    if (existing.onboardingCompleted) {
      throw new AppError("Onboarding already completed", 400);
    }

    const qaText = body.questions
      .map((q, i) => `Q: ${q}\nA: ${body.answers[i]}`)
      .join("\n\n");

    const systemPrompt = `You are the support chatbot for ${body.businessName} (${body.businessIndustry}).
Website: ${body.businessWebsite || "n/a"}
About: ${body.businessDescription}
Answer only from the business knowledge provided. Be clear, helpful, and brief (widget-sized replies).`;

    const clientId = generateClientId();
    const clientSecret = generateClientSecret();

    let project = await prisma.project.findFirst({
      where: { ownerId: req.user!.id },
      orderBy: { createdAt: "asc" },
      include: { credentials: { where: { revokedAt: null }, take: 1 } },
    });

    if (project) {
      project = await prisma.project.update({
        where: { id: project.id },
        data: {
          name: body.projectName,
          description: body.projectDescription ?? body.businessDescription.slice(0, 500),
          category: body.businessIndustry,
          systemPrompt,
        },
        include: { credentials: { where: { revokedAt: null }, take: 1 } },
      });

      if (project.credentials.length > 0) {
        const existingCred = project.credentials[0]!;
        await prisma.apiCredential.update({
          where: { id: existingCred.id },
          data: { revokedAt: new Date() },
        });
      }
      await prisma.apiCredential.create({
        data: {
          projectId: project.id,
          clientId,
          clientSecretHash: hashSecret(clientSecret),
          label: "default",
        },
      });
    } else {
      project = await prisma.$transaction(async (tx) => {
        const created = await tx.project.create({
          data: {
            ownerId: req.user!.id,
            name: body.projectName,
            description: body.projectDescription ?? body.businessDescription.slice(0, 500),
            category: body.businessIndustry,
            systemPrompt,
            credentials: {
              create: {
                clientId,
                clientSecretHash: hashSecret(clientSecret),
                label: "default",
              },
            },
          },
          include: { credentials: { where: { revokedAt: null }, take: 1 } },
        });
        await tx.projectMember.create({
          data: {
            projectId: created.id,
            userId: req.user!.id,
            role: "owner",
          },
        });
        return created;
      });
    }

    const doc = await prisma.knowledgeDocument.create({
      data: {
        projectId: project.id,
        title: `${body.businessName} — onboarding FAQ`,
        sourceType: "faq",
        rawContent: `Business profile\nName: ${body.businessName}\nIndustry: ${body.businessIndustry}\nWebsite: ${body.businessWebsite || "n/a"}\nLocation: ${body.businessLocation || "n/a"}\nSupport: ${body.supportEmail || "n/a"}\n\nDescription:\n${body.businessDescription}\n\nQ&A:\n${qaText}`,
        status: "PENDING",
      },
    });

    try {
      const queue = getIngestQueue();
      await queue.add(
        "ingest-document",
        { documentId: doc.id, projectId: project.id },
        { removeOnComplete: 100, removeOnFail: 50, attempts: 3 },
      );
      await queue.close();
    } catch {
      // non-fatal for onboarding — doc stays PENDING/FAILED later
    }

    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        onboardingCompleted: true,
        businessName: body.businessName,
        businessWebsite: body.businessWebsite || null,
        businessIndustry: body.businessIndustry,
        businessDescription: body.businessDescription,
        onboardingQuestions: body.questions,
        onboardingAnswers: body.answers,
      },
    });

    return {
      success: true,
      project: { id: project.id, name: body.projectName },
      credentials: { clientId, clientSecret },
      message: "Store clientSecret now — it will not be shown again.",
    };
  });
}
