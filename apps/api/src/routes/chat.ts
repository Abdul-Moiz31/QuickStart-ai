import type { FastifyInstance } from "fastify";
import { connectMongo, getChatSessionModel, prisma } from "@quickstart-ai/db";
import {
  createChatClient,
  createEmbeddingsClient,
  getCachedAnswer,
  pushSessionMemory,
  runAgenticRag,
  setCachedAnswer,
} from "@quickstart-ai/rag";
import { collectAndEmitChatEvents } from "@quickstart-ai/events";
import { chatMessageSchema, createSessionSchema, NotFoundError } from "@quickstart-ai/shared";
import { requireClient } from "../auth.js";
import { getProjectLlmRuntime } from "../project-llm.js";
import { getRedis } from "../redis.js";
import { env } from "../env.js";

function streamError(reply: { raw: NodeJS.WritableStream }, message: string) {
  reply.raw.write(`data: ${JSON.stringify({ type: "error", message })}\n\n`);
  reply.raw.end();
}

function userFacingChatError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/api key|401|403|unauthorized|invalid.*key/i.test(msg)) {
    return "AI service is not configured. Check your API key in project settings.";
  }
  if (/rate limit|429/i.test(msg)) {
    return "Too many requests right now. Please try again in a moment.";
  }
  if (/embed|vector|dimension/i.test(msg)) {
    return "Knowledge search is temporarily unavailable. Please try again.";
  }
  return "Sorry, something went wrong. Please try again.";
}

export async function chatRoutes(app: FastifyInstance) {
  app.post("/api/v1/chat/session", async (req) => {
    await requireClient(req);
    const body = createSessionSchema.parse(req.body);
    await connectMongo();
    const Session = getChatSessionModel();
    const session = await Session.create({
      projectId: req.projectId!,
      visitorName: body.visitorName,
      visitorEmail: body.visitorEmail,
      messages: [
        {
          role: "assistant",
          content: "Hello! How can I assist you today?",
        },
      ],
    });
    return { success: true, session: { id: String(session._id), projectId: req.projectId } };
  });

  app.get("/api/v1/chat/config", async (req) => {
    await requireClient(req);
    const project = await prisma.project.findUnique({ where: { id: req.projectId! } });
    if (!project) throw new NotFoundError("Project not found");
    return {
      success: true,
      config: {
        projectId: project.id,
        name: project.name,
        theme: project.widgetTheme,
        position: project.widgetPosition,
        primaryColor: project.primaryColor,
        welcomeMessage: project.welcomeMessage,
        description: project.description,
      },
    };
  });

  app.post("/api/v1/chat/message", async (req, reply) => {
    await requireClient(req);
    const body = chatMessageSchema.parse(req.body);
    const project = await prisma.project.findUnique({
      where: { id: req.projectId! },
      include: { owner: { select: { businessWebsite: true } } },
    });
    if (!project) throw new NotFoundError("Project not found");

    await connectMongo();
    const Session = getChatSessionModel();
    let sessionId = body.sessionId;
    if (!sessionId) {
      const created = await Session.create({
        projectId: project.id,
        visitorName: body.visitorName ?? "Guest",
        visitorEmail: body.visitorEmail ?? "guest@example.com",
        messages: [],
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

    let cached: string | null = null;
    try {
      cached = await getCachedAnswer(redis, project.id, body.message);
    } catch {
      cached = null;
    }

    if (cached) {
      session.messages.push({ role: "user", content: body.message });
      session.messages.push({ role: "assistant", content: cached, meta: { cached: true } });
      await session.save();
      if (body.stream) {
        reply.header("Content-Type", "text/event-stream");
        reply.header("Cache-Control", "no-cache");
        reply.raw.write(
          `data: ${JSON.stringify({ type: "meta", sessionId, confidence: "high" })}\n\n`,
        );
        for (const part of cached.match(/\S+\s*|\s+/g) ?? [cached]) {
          reply.raw.write(`data: ${JSON.stringify({ type: "token", content: part })}\n\n`);
        }
        reply.raw.write(`data: ${JSON.stringify({ type: "done", toolsUsed: [] })}\n\n`);
        reply.raw.end();
        return;
      }
      return {
        success: true,
        sessionId,
        answer: cached,
        cached: true,
        confidence: "high",
        toolsUsed: [],
      };
    }

    const llmRuntime = getProjectLlmRuntime(project);
    const embeddings = createEmbeddingsClient(llmRuntime);
    const chat = createChatClient(llmRuntime);
    const history = session.messages.slice(-10).map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    }));

    const userMsgCount = session.messages.filter((m) => m.role === "user").length;
    const isFirstUserMessage = userMsgCount === 0;

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
        visitorName: session.visitorName,
        visitorEmail: session.visitorEmail,
      });
    } catch (err) {
      const message = userFacingChatError(err);
      req.log.error({ err }, "chat RAG failed");
      if (body.stream) {
        reply.header("Content-Type", "text/event-stream");
        reply.header("Cache-Control", "no-cache");
        reply.raw.write(`data: ${JSON.stringify({ type: "meta", sessionId })}\n\n`);
        streamError(reply, message);
        return;
      }
      return reply.status(503).send({
        success: false,
        code: "CHAT_FAILED",
        message,
        sessionId,
      });
    }

    session.messages.push({ role: "user", content: body.message });
    session.messages.push({
      role: "assistant",
      content: result.answer,
      meta: {
        confidence: result.confidence,
        toolsUsed: result.toolsUsed,
        events: result.eventsEmitted.map((e) => e.type),
      },
    });
    await session.save();

    void collectAndEmitChatEvents({
      projectId: project.id,
      sessionId,
      visitor: { name: session.visitorName, email: session.visitorEmail },
      userMessage: body.message,
      assistantAnswer: result.answer,
      confidence: result.confidence,
      toolsUsed: result.toolsUsed,
      chunkCount: result.chunks.length,
      isFirstUserMessage,
      agentEvents: result.eventsEmitted.map((e) => ({
        type: e.type,
        name: e.name,
        description: e.description,
        source: "tool" as const,
        sessionId,
        payload: e.payload,
      })),
      redisUrl: env.redisUrl,
      webAppUrl: env.webAppUrl,
    }).catch((err) => req.log.error({ err }, "event emit failed"));

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
        meta: { confidence: result.confidence, toolsUsed: result.toolsUsed },
      },
    });

    if (body.stream) {
      reply.header("Content-Type", "text/event-stream");
      reply.header("Cache-Control", "no-cache");
      reply.raw.write(`data: ${JSON.stringify({ type: "meta", sessionId, confidence: result.confidence })}\n\n`);
      const parts = result.answer.match(/\S+\s*|\s+/g) ?? [result.answer];
      for (const part of parts) {
        reply.raw.write(`data: ${JSON.stringify({ type: "token", content: part })}\n\n`);
      }
      reply.raw.write(`data: ${JSON.stringify({ type: "done", toolsUsed: result.toolsUsed })}\n\n`);
      reply.raw.end();
      return;
    }

    return {
      success: true,
      sessionId,
      answer: result.answer,
      cached: false,
      confidence: result.confidence,
      toolsUsed: result.toolsUsed,
      sources: result.chunks.map((c) => ({ id: c.id, score: c.score })),
    };
  });
}
