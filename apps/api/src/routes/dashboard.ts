import type { FastifyInstance } from "fastify";
import { Queue } from "bullmq";
import { z } from "zod";
import { connectMongo, getChatSessionModel, prisma } from "@quickstart-ai/db";
import {
  createChatClient,
  createEmbeddingsClient,
  getCachedAnswer,
  pushSessionMemory,
  runAgenticRag,
  setCachedAnswer,
} from "@quickstart-ai/rag";
import {
  AppError,
  computeEvalReadiness,
  EVAL_PASS_THRESHOLDS,
  MIN_KNOWLEDGE_QA,
  NotFoundError,
  parseKnowledgeQa,
  QUEUE_NAMES,
} from "@quickstart-ai/shared";
import type { EvalCase } from "@quickstart-ai/eval";
import { requireAuth } from "../auth.js";
import { getProjectChatRuntime, getProjectEmbeddingsRuntime } from "../project-llm.js";
import { env } from "../env.js";
import { getRedis } from "../redis.js";

const playgroundMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().optional(),
});

const MAX_EVAL_CASES = 15;

async function loadKnowledgeQaCases(projectId: string): Promise<{
  pairs: { question: string; answer: string }[];
  readyDocCount: number;
  cases: EvalCase[];
}> {
  const docs = await prisma.knowledgeDocument.findMany({
    where: { projectId, status: "READY" },
    select: { id: true, rawContent: true },
  });
  const pairs = docs.flatMap((d) => parseKnowledgeQa(d.rawContent ?? ""));
  const cases: EvalCase[] = pairs.slice(0, MAX_EVAL_CASES).map((p, i) => ({
    id: `qa-${i + 1}`,
    question: p.question,
    expected: p.answer,
  }));
  return { pairs, readyDocCount: docs.length, cases };
}

function getEvalQueue() {
  return new Queue(QUEUE_NAMES.EVAL, {
    connection: { url: env.redisUrl },
  });
}

async function enqueueEval(runId: string, projectId: string) {
  const queue = getEvalQueue();
  try {
    await queue.add(
      "run-eval",
      { runId, projectId },
      {
        removeOnComplete: 50,
        removeOnFail: 20,
        attempts: 1,
        jobId: runId,
      },
    );
  } finally {
    await queue.close();
  }
}

type SessionLean = {
  _id: unknown;
  projectId?: string;
  visitorName?: string;
  visitorEmail?: string;
  messages?: { role?: string; content?: string; createdAt?: Date }[];
  memorySummary?: string;
  metadata?: unknown;
  updatedAt?: Date;
  createdAt?: Date;
};

function isVisitorSession(s: SessionLean): boolean {
  const email = String(s.visitorEmail ?? "");
  const name = String(s.visitorName ?? "");
  const meta = (s.metadata ?? {}) as { playground?: boolean };
  if (meta.playground) return false;
  if (email.includes("+admin-test@")) return false;
  if (name.includes("(admin test)") || name.includes("(admin)")) return false;
  return true;
}

function formatSessionSummary(s: SessionLean) {
  return {
    id: String(s._id),
    visitorName: s.visitorName,
    visitorEmail: s.visitorEmail,
    messageCount: s.messages?.length ?? 0,
    lastMessage: s.messages?.[s.messages.length - 1]?.content ?? "",
    updatedAt: s.updatedAt,
    createdAt: s.createdAt,
  };
}

function formatSessionDetail(s: SessionLean) {
  return {
    id: String(s._id),
    visitorName: s.visitorName,
    visitorEmail: s.visitorEmail,
    memorySummary: s.memorySummary ?? "",
    messageCount: s.messages?.length ?? 0,
    messages: (s.messages ?? []).map((m) => ({
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    })),
    updatedAt: s.updatedAt,
    createdAt: s.createdAt,
  };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function requireOwnedProject(projectId: string, ownerId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
  });
  if (!project) throw new NotFoundError("Project not found");
  return project;
}

export async function dashboardRoutes(app: FastifyInstance) {
  app.get("/api/v1/projects/:id/sessions", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await requireOwnedProject(id, req.user!.id);
    const limitRaw = Number((req.query as { limit?: string }).limit ?? 100);
    const limit = Math.min(Math.max(limitRaw || 100, 1), 100);
    await connectMongo();
    const Session = getChatSessionModel();
    const sessions = await Session.find({ projectId: id })
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();

    const visitorSessions = (sessions as SessionLean[]).filter(isVisitorSession);

    return {
      success: true,
      sessions: visitorSessions.slice(0, limit).map(formatSessionSummary),
    };
  });

  app.get("/api/v1/projects/:id/sessions/search", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await requireOwnedProject(id, req.user!.id);
    const q = String((req.query as { q?: string }).q ?? "").trim();
    if (!q) throw new AppError("Query parameter q is required", 400);
    const limitRaw = Number((req.query as { limit?: string }).limit ?? 50);
    const limit = Math.min(Math.max(limitRaw || 50, 1), 100);
    await connectMongo();
    const Session = getChatSessionModel();
    const regex = new RegExp(escapeRegex(q), "i");
    const sessions = await Session.find({
      projectId: id,
      $or: [
        { visitorName: regex },
        { visitorEmail: regex },
        { "messages.content": regex },
      ],
    })
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();

    const visitorSessions = (sessions as SessionLean[]).filter(isVisitorSession);

    return {
      success: true,
      query: q,
      sessions: visitorSessions.slice(0, limit).map(formatSessionSummary),
    };
  });

  app.get("/api/v1/projects/:id/sessions/:sessionId", async (req) => {
    await requireAuth(req);
    const { id, sessionId } = req.params as { id: string; sessionId: string };
    await requireOwnedProject(id, req.user!.id);
    await connectMongo();
    const Session = getChatSessionModel();
    const session = await Session.findById(sessionId).lean();
    if (!session || session.projectId !== id) throw new NotFoundError("Session not found");
    return { success: true, session: formatSessionDetail(session as SessionLean) };
  });

  /** Owner playground — try the live chatbot against project knowledge (JWT auth). */
  app.post("/api/v1/projects/:id/playground/message", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    const project = await prisma.project.findFirst({
      where: { id, ownerId: req.user!.id },
      include: { owner: { select: { businessWebsite: true } } },
    });
    if (!project) throw new NotFoundError("Project not found");

    const body = playgroundMessageSchema.parse(req.body);
    await connectMongo();
    const Session = getChatSessionModel();

    let sessionId = body.sessionId;
    if (!sessionId) {
      const welcome = project.welcomeMessage?.trim() || "Hi — how can I help?";
      const created = await Session.create({
        projectId: project.id,
        visitorName: `${req.user!.email.split("@")[0]} (admin test)`,
        visitorEmail: req.user!.email.replace("@", "+admin-test@"),
        messages: [{ role: "assistant", content: welcome }],
        metadata: { playground: true },
      });
      sessionId = String(created._id);
    }

    const session = await Session.findById(sessionId);
    if (!session || session.projectId !== project.id) {
      throw new NotFoundError("Session not found");
    }

    const redis = getRedis();
    try {
      if (redis.status !== "ready") await redis.connect();
    } catch {
      // continue without cache
    }

    session.messages.push({ role: "user", content: body.message });
    await session.save();

    let cached: string | null = null;
    try {
      cached = await getCachedAnswer(redis, project.id, body.message);
    } catch {
      cached = null;
    }

    if (cached) {
      session.messages.push({
        role: "assistant",
        content: cached,
        meta: { cached: true, playground: true },
      });
      await session.save();
      return {
        success: true,
        sessionId,
        answer: cached,
        cached: true,
        confidence: "high",
        toolsUsed: [] as string[],
        messages: session.messages,
      };
    }

    const chatRuntime = getProjectChatRuntime(project);
    const embeddingsRuntime = getProjectEmbeddingsRuntime(project);
    const embeddings = createEmbeddingsClient(embeddingsRuntime);
    const chat = createChatClient(chatRuntime);
    const history = session.messages.slice(-10).map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    }));

    let result;
    try {
      result = await runAgenticRag({
        projectId: project.id,
        projectName: project.name,
        systemPrompt: project.systemPrompt || undefined,
        query: body.message,
        history,
        embeddings,
        chat,
        toolsWebSearch: project.toolsWebSearch,
        toolsHumanHandoff: project.toolsHumanHandoff,
        toolsLeadCapture: project.toolsLeadCapture,
        businessWebsite: project.owner?.businessWebsite ?? undefined,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Chat model temporarily unavailable";
      console.error("[playground] RAG failed", err);
      const fallback =
        "I'm having trouble reaching the AI provider right now (rate limit or outage). Please try again in a few seconds.";
      session.messages.push({
        role: "assistant",
        content: fallback,
        meta: { playground: true, error: message },
      });
      await session.save();
      return {
        success: true,
        sessionId,
        answer: fallback,
        cached: false,
        confidence: "low",
        toolsUsed: [] as string[],
        messages: session.messages,
        warning: message,
      };
    }

    session.messages.push({
      role: "assistant",
      content: result.answer,
      meta: {
        confidence: result.confidence,
        toolsUsed: result.toolsUsed,
        playground: true,
      },
    });
    await session.save();

    try {
      if (result.confidence !== "low") {
        await setCachedAnswer(redis, project.id, body.message, result.answer);
      }
      await pushSessionMemory(redis, sessionId, `U:${body.message}\nA:${result.answer}`);
    } catch {
      // ignore cache errors
    }

    await prisma.usageEvent.create({
      data: {
        projectId: project.id,
        kind: "chat_message",
        units: 1,
        meta: {
          confidence: result.confidence,
          toolsUsed: result.toolsUsed,
          playground: true,
        },
      },
    });

    return {
      success: true,
      sessionId,
      answer: result.answer,
      cached: false,
      confidence: result.confidence,
      toolsUsed: result.toolsUsed,
      sources: result.chunks.map((c) => ({ id: c.id, score: c.score })),
      messages: session.messages,
    };
  });

  app.post("/api/v1/projects/:id/playground/reset", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    const project = await prisma.project.findFirst({
      where: { id, ownerId: req.user!.id },
    });
    if (!project) throw new NotFoundError("Project not found");
    const welcome = project.welcomeMessage?.trim() || "Hi — how can I help?";
    await connectMongo();
    const Session = getChatSessionModel();
    const created = await Session.create({
      projectId: project.id,
      visitorName: `${req.user!.email.split("@")[0]} (admin test)`,
      visitorEmail: req.user!.email.replace("@", "+admin-test@"),
      messages: [{ role: "assistant", content: welcome }],
      metadata: { playground: true },
    });
    return {
      success: true,
      sessionId: String(created._id),
      welcome,
      messages: created.messages,
    };
  });

  app.get("/api/v1/projects/:id/analytics", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    const project = await prisma.project.findFirst({
      where: { id, ownerId: req.user!.id },
    });
    if (!project) throw new NotFoundError("Project not found");

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = await prisma.usageEvent.groupBy({
      by: ["kind"],
      where: { projectId: id, createdAt: { gte: since } },
      _sum: { units: true },
      _count: true,
    });

    await connectMongo();
    const Session = getChatSessionModel();
    const sessionCount = await Session.countDocuments({ projectId: id });
    const docCount = await prisma.knowledgeDocument.count({ where: { projectId: id } });

    return {
      success: true,
      analytics: {
        sessionCount,
        documentCount: docCount,
        credits: project.credits,
        plan: project.plan,
        usage: events,
      },
    };
  });

  app.get("/api/v1/projects/:id/eval/status", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    const project = await prisma.project.findFirst({
      where: { id, ownerId: req.user!.id },
    });
    if (!project) throw new NotFoundError("Project not found");

    const { pairs, readyDocCount } = await loadKnowledgeQaCases(id);
    const qaCount = pairs.length;
    const hasEnoughKnowledge = qaCount >= MIN_KNOWLEDGE_QA;
    const lastRun = await prisma.evalRun.findFirst({
      where: { projectId: id, status: { in: ["passed", "failed"] } },
      orderBy: { createdAt: "desc" },
    });
    const activeRun = await prisma.evalRun.findFirst({
      where: { projectId: id, status: { in: ["queued", "running"] } },
      orderBy: { createdAt: "desc" },
    });

    // Keep evalPassedAt honest if knowledge dropped below minimum
    if (project.evalPassedAt && !hasEnoughKnowledge) {
      await prisma.project.update({
        where: { id },
        data: { evalPassedAt: null },
      });
      project.evalPassedAt = null;
    }

    const lastMetrics = (lastRun?.metrics ?? null) as Record<string, number> | null;
    const readiness = computeEvalReadiness({
      qaCount,
      minQaRequired: MIN_KNOWLEDGE_QA,
      hasEnoughKnowledge,
      lastRunStatus: lastRun?.status ?? null,
      metrics: lastMetrics,
      thresholds: EVAL_PASS_THRESHOLDS,
    });

    return {
      success: true,
      status: {
        qaCount,
        minQaRequired: MIN_KNOWLEDGE_QA,
        hasEnoughKnowledge,
        readyDocCount,
        evalPassedAt: project.evalPassedAt,
        productionReady: readiness.productionReady,
        thresholds: EVAL_PASS_THRESHOLDS,
        readiness,
        activeRun: activeRun
          ? {
              id: activeRun.id,
              status: activeRun.status,
              metrics: activeRun.metrics,
              createdAt: activeRun.createdAt,
            }
          : null,
        lastRun: lastRun
          ? {
              id: lastRun.id,
              status: lastRun.status,
              metrics: lastRun.metrics,
              finishedAt: lastRun.finishedAt,
              createdAt: lastRun.createdAt,
            }
          : null,
      },
    };
  });

  app.post("/api/v1/projects/:id/eval/run", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    const project = await prisma.project.findFirst({
      where: { id, ownerId: req.user!.id },
    });
    if (!project) throw new NotFoundError("Project not found");

    const active = await prisma.evalRun.findFirst({
      where: { projectId: id, status: { in: ["queued", "running"] } },
    });
    if (active) {
      throw new AppError("An evaluation is already in progress", 409);
    }

    const { pairs, cases } = await loadKnowledgeQaCases(id);
    if (pairs.length < MIN_KNOWLEDGE_QA) {
      throw new AppError(
        `Add at least ${MIN_KNOWLEDGE_QA} knowledge Q&A pairs (Q: / A:) before running eval. You have ${pairs.length}.`,
        400,
      );
    }

    const dataset =
      (await prisma.evalDataset.findFirst({
        where: { projectId: id, name: "knowledge-qa" },
      })) ??
      (await prisma.evalDataset.create({
        data: {
          projectId: id,
          name: "knowledge-qa",
          items: {
            create: cases.map((c) => ({
              question: c.question,
              expected: c.expected,
              metadata: {},
            })),
          },
        },
      }));

    const run = await prisma.evalRun.create({
      data: {
        projectId: id,
        datasetId: dataset.id,
        status: "queued",
        metrics: {
          progress: {
            current: 0,
            total: cases.length,
            message: "Queued — waiting for worker…",
            phase: "starting",
          },
        },
      },
    });

    try {
      await enqueueEval(run.id, id);
    } catch (err) {
      await prisma.evalRun.update({
        where: { id: run.id },
        data: {
          status: "failed",
          finishedAt: new Date(),
          metrics: {
            error: err instanceof Error ? err.message : "Failed to enqueue eval",
          },
        },
      });
      throw new AppError("Failed to queue eval job. Is Redis running?", 503);
    }

    return {
      success: true,
      queued: true,
      runId: run.id,
      status: "queued",
      totalQuestions: cases.length,
    };
  });
}
