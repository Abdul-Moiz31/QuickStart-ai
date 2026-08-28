import type { FastifyInstance } from "fastify";
import { prisma } from "@quickstart-ai/db";
import {
  ONBOARDING_MODEL_CHAIN,
  chatWithModelFallback,
  fetchWebsiteSummary,
} from "@quickstart-ai/rag";
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
import { QUEUE_NAMES } from "@quickstart-ai/shared";

const MAX_QUESTIONS = 12;

const FALLBACK_QUESTIONS = [
  "What products or services do you offer?",
  "Who is your ideal customer?",
  "What are your business hours and timezone?",
  "What are your most common customer questions?",
  "How does pricing work (plans, trials, billing)?",
  "What is your refund or cancellation policy?",
  "How can customers contact support?",
  "Do you offer demos, onboarding, or setup help?",
  "What integrations or tools do you support?",
  "Are there any limitations or known issues customers should know?",
  "What makes your business different from competitors?",
  "Where should the chatbot send leads or urgent requests?",
];

function getIngestQueue() {
  return new Queue(QUEUE_NAMES.INGEST, {
    connection: { url: env.redisUrl },
  });
}

function parseQuestions(raw: string): string[] | null {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as unknown;
    if (!Array.isArray(parsed)) return null;
    const questions = parsed
      .filter((q): q is string => typeof q === "string" && q.trim().length > 0)
      .map((q) => q.trim())
      .slice(0, MAX_QUESTIONS);
    return questions.length >= 6 ? questions : null;
  } catch {
    return null;
  }
}

async function generateQuestions(profile: {
  businessName: string;
  businessWebsite?: string;
  businessIndustry: string;
  businessDescription: string;
  businessLocation?: string;
}): Promise<{ questions: string[]; model?: string; researchedWebsite?: boolean }> {
  let websiteContext = "";
  let researchedWebsite = false;
  if (profile.businessWebsite) {
    const summary = await fetchWebsiteSummary(profile.businessWebsite);
    if (summary) {
      researchedWebsite = true;
      websiteContext = `\n\nWebsite research (extracted public page text):\n${summary}`;
    }
  }

  try {
    const { content, model } = await chatWithModelFallback(
      [
        {
          role: "system",
          content: `You help set up a website support chatbot. Return ONLY a JSON array of exactly ${MAX_QUESTIONS} short, specific questions a business owner should answer so the chatbot can help customers. Use the website research when present to ask sharper, business-specific questions. No markdown, no commentary.`,
        },
        {
          role: "user",
          content: `Business: ${profile.businessName}
Industry: ${profile.businessIndustry}
Website: ${profile.businessWebsite || "n/a"}
Location: ${profile.businessLocation || "n/a"}
Description: ${profile.businessDescription}${websiteContext}

Generate ${MAX_QUESTIONS} onboarding questions tailored to this business.`,
        },
      ],
      ONBOARDING_MODEL_CHAIN,
      { temperature: 0.4, maxTokens: 1200 },
    );

    const questions = parseQuestions(content);
    if (questions) {
      return { questions, model, researchedWebsite };
    }
  } catch (err) {
    console.warn("[onboarding] question generation failed, using fallbacks", err);
  }

  return {
    questions: FALLBACK_QUESTIONS.slice(0, MAX_QUESTIONS),
    researchedWebsite,
  };
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

  app.post("/api/v1/onboarding/questions", async (req) => {
    await requireAuth(req);
    const body = onboardingBusinessSchema.parse(req.body);
    const { questions, model, researchedWebsite } = await generateQuestions({
      businessName: body.businessName,
      businessWebsite: body.businessWebsite || undefined,
      businessIndustry: body.businessIndustry,
      businessDescription: body.businessDescription,
      businessLocation: body.businessLocation || undefined,
    });

    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        businessName: body.businessName,
        businessWebsite: body.businessWebsite || null,
        businessIndustry: body.businessIndustry,
        businessDescription: body.businessDescription,
        onboardingQuestions: questions,
      },
    });

    return {
      success: true,
      questions,
      maxQuestions: MAX_QUESTIONS,
      model: model ?? null,
      researchedWebsite: Boolean(researchedWebsite),
    };
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
      project = await prisma.project.create({
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
