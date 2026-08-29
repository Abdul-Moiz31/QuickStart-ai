import type { FastifyInstance } from "fastify";
import { prisma } from "@quickstart-ai/db";
import {
  AppError,
  createProjectSchema,
  NotFoundError,
  PLAN_LIMITS,
  updateLlmSettingsSchema,
  updateProjectSchema,
  getProviderOption,
  getModelPreset,
  resolveModelId,
} from "@quickstart-ai/shared";
import { requireAuth } from "../auth.js";
import {
  generateClientId,
  generateClientSecret,
  hashSecret,
} from "../credentials.js";
import { encryptSecret } from "../crypto.js";
import { getProjectLlmPublicSettings } from "../project-llm.js";
import { env } from "../env.js";

async function assertProjectOwner(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!project) throw new NotFoundError("Project not found");
  return project;
}

export async function projectRoutes(app: FastifyInstance) {
  app.get("/api/v1/projects", async (req) => {
    await requireAuth(req);
    const projects = await prisma.project.findMany({
      where: { ownerId: req.user!.id },
      orderBy: { createdAt: "desc" },
      include: {
        credentials: {
          where: { revokedAt: null },
          select: { id: true, clientId: true, label: true, lastUsedAt: true, createdAt: true },
        },
        _count: { select: { documents: true } },
      },
    });
    return { success: true, projects };
  });

  app.post("/api/v1/projects", async (req) => {
    await requireAuth(req);
    const owner = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { onboardingCompleted: true },
    });
    if (!owner?.onboardingCompleted) {
      throw new AppError("Complete onboarding for your default project first", 403);
    }
    const body = createProjectSchema.parse(req.body);
    const count = await prisma.project.count({ where: { ownerId: req.user!.id } });
    const plan = "free" as const;
    if (count >= PLAN_LIMITS[plan].projects) {
      throw new AppError("Project limit reached for your plan", 403);
    }

    const clientId = generateClientId();
    const clientSecret = generateClientSecret();
    const project = await prisma.project.create({
      data: {
        ownerId: req.user!.id,
        name: body.name,
        description: body.description ?? "",
        category: body.category ?? "",
        credentials: {
          create: {
            clientId,
            clientSecretHash: hashSecret(clientSecret),
            label: "default",
          },
        },
      },
    });

    return {
      success: true,
      project,
      credentials: { clientId, clientSecret },
      message: "Store clientSecret now — it will not be shown again.",
    };
  });

  app.get("/api/v1/projects/:id", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    const project = await assertProjectOwner(id, req.user!.id);
    const credentials = await prisma.apiCredential.findMany({
      where: { projectId: id, revokedAt: null },
      select: { id: true, clientId: true, label: true, lastUsedAt: true, createdAt: true },
    });
    const docs = await prisma.knowledgeDocument.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return {
      success: true,
      project,
      credentials,
      documents: docs,
      llm: getProjectLlmPublicSettings(project),
    };
  });

  app.patch("/api/v1/projects/:id/llm", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    const project = await assertProjectOwner(id, req.user!.id);
    const body = updateLlmSettingsSchema.parse(req.body);
    const providerId = body.useOwnLlmKey ? body.llmProvider : "platform";
    const provider = getProviderOption(providerId);

    if (body.useOwnLlmKey && providerId !== "platform" && !provider) {
      throw new AppError("Invalid LLM provider", 400);
    }

    const modelId = body.useOwnLlmKey
      ? resolveModelId(providerId, body.llmModel ?? null)
      : null;

    if (body.useOwnLlmKey && providerId !== "platform") {
      if (!modelId || !getModelPreset(providerId, modelId)) {
        throw new AppError("Invalid model selection for provider", 400);
      }
    }

    const data: {
      llmProvider: string;
      useOwnLlmKey: boolean;
      llmModel: string | null;
      llmBaseUrl: string | null;
      llmApiKeyEnc?: string | null;
    } = {
      llmProvider: providerId,
      useOwnLlmKey: body.useOwnLlmKey,
      llmModel: modelId,
      llmBaseUrl: body.useOwnLlmKey && provider ? provider.defaultBaseUrl : null,
    };

    if (body.llmApiKey !== undefined) {
      if (body.llmApiKey === "") {
        data.llmApiKeyEnc = null;
      } else {
        if (!env.encryptionKey || env.encryptionKey.length < 32) {
          throw new AppError("Server encryption is not configured for API keys", 503);
        }
        data.llmApiKeyEnc = encryptSecret(body.llmApiKey.trim());
      }
    }

    if (body.useOwnLlmKey && body.llmProvider !== "platform") {
      const hasKey = data.llmApiKeyEnc !== null ? Boolean(data.llmApiKeyEnc) : Boolean(project.llmApiKeyEnc);
      if (!hasKey) {
        throw new AppError("API key is required when using your own LLM provider", 400);
      }
    }

    const updated = await prisma.project.update({
      where: { id },
      data,
    });
    return { success: true, llm: getProjectLlmPublicSettings(updated) };
  });

  app.patch("/api/v1/projects/:id", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await assertProjectOwner(id, req.user!.id);
    const body = updateProjectSchema.parse(req.body);
    const project = await prisma.project.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        allowedOrigins: body.allowedOrigins,
        widgetTheme: body.widgetTheme,
        widgetPosition: body.widgetPosition,
        systemPrompt: body.systemPrompt,
        primaryColor: body.primaryColor,
        welcomeMessage: body.welcomeMessage,
        toolsWebSearch: body.toolsWebSearch,
        toolsHumanHandoff: body.toolsHumanHandoff,
        toolsLeadCapture: body.toolsLeadCapture,
        allowAnonymousSessions: body.allowAnonymousSessions,
        proactiveTriggers: body.proactiveTriggers,
      },
    });
    return { success: true, project };
  });

  app.post("/api/v1/projects/:id/credentials/rotate", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await assertProjectOwner(id, req.user!.id);

    await prisma.apiCredential.updateMany({
      where: { projectId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    const clientId = generateClientId();
    const clientSecret = generateClientSecret();
    const cred = await prisma.apiCredential.create({
      data: {
        projectId: id,
        clientId,
        clientSecretHash: hashSecret(clientSecret),
        label: "rotated",
      },
    });

    return {
      success: true,
      credentials: { id: cred.id, clientId, clientSecret },
      message: "Previous credentials revoked. Store the new clientSecret now.",
    };
  });
}
