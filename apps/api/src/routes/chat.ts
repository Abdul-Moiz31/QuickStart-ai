import type { FastifyInstance, FastifyReply } from "fastify";
import {
  connectMongo,
  getChatSessionModel,
  isValidSessionId,
  prisma,
} from "@quickstart-ai/db";
import {
  type AgentStreamPreamble,
  createChatClient,
  createEmbeddingsClient,
  getCachedAnswer,
  pushSessionMemory,
  runAgenticRag,
  runAgenticRagStream,
  setCachedAnswer,
} from "@quickstart-ai/rag";
import { collectAndEmitChatEvents } from "@quickstart-ai/events";
import {
  AppError,
  BUILTIN_EVENT_TYPES,
  chatMessageSchema,
  createSessionSchema,
  NotFoundError,
  PLAN_LIMITS,
  type PlanTier,
} from "@quickstart-ai/shared";
import { requireClient } from "../auth.js";
import { getProjectChatRuntime, getProjectEmbeddingsRuntime } from "../project-llm.js";
import { getRedis } from "../redis.js";
import { publishInboxEvent } from "../realtime.js";
import { isHandoffStale, releaseStaleHandoff } from "../handoff.js";
import { env } from "../env.js";
import { scheduleSessionReview } from "../session-review.js";
import { beginSseReply, endSse, writeSseEvent } from "../sse.js";

function streamError(reply: FastifyReply, message: string) {
  writeSseEvent(reply, { type: "error", message });
  endSse(reply);
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

function didEscalate(events: { type: string }[]): boolean {
  return events.some((e) => e.type === BUILTIN_EVENT_TYPES.HUMAN_HANDOFF);
}

async function isStillBotControlled(
  Session: ReturnType<typeof getChatSessionModel>,
  sessionId: string,
): Promise<boolean> {
  const fresh = await Session.findById(sessionId).select("humanActive").lean();
  return !fresh?.humanActive;
}

async function markSessionEscalated(
  Session: ReturnType<typeof getChatSessionModel>,
  sessionId: string,
  projectId: string,
  visitorName: string,
  triggerMessage?: string,
): Promise<void> {
  const now = new Date();
  await Session.updateOne(
    { _id: sessionId, humanActive: { $ne: true } },
    { $set: { humanPending: true, escalatedAt: now } },
  );
  void publishInboxEvent(projectId, {
    type: "escalation",
    sessionId,
    visitorName,
    message: triggerMessage,
    at: now.toISOString(),
  });
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

  app.get("/api/v1/chat/sessions/:sessionId/messages", async (req) => {
    await requireClient(req, { touch: false });
    const { sessionId } = req.params as { sessionId: string };
    if (!isValidSessionId(sessionId)) throw new NotFoundError("Session not found");
    await connectMongo();
    const Session = getChatSessionModel();
    const session = await Session.findById(sessionId)
      .select("projectId humanActive humanPending messages")
      .lean();
    if (!session || session.projectId !== req.projectId) {
      throw new NotFoundError("Session not found");
    }
    return {
      success: true,
      humanActive: Boolean(session.humanActive),
      humanPending: Boolean(session.humanPending),
      messages: (session.messages ?? [])
        .filter((m) => m.role !== "system" && m.role !== "tool")
        .filter((m) => !(m.meta as { suppressed?: boolean } | undefined)?.suppressed)
        .map((m) => ({ role: m.role, content: m.content })),
    };
  });

  /** Visitor confirms they want to speak with a human agent. */
  app.post("/api/v1/chat/sessions/:sessionId/request-handoff", async (req) => {
    await requireClient(req);
    const { sessionId } = req.params as { sessionId: string };
    if (!isValidSessionId(sessionId)) throw new NotFoundError("Session not found");

    await connectMongo();
    const Session = getChatSessionModel();
    const session = await Session.findById(sessionId);
    if (!session || session.projectId !== req.projectId) {
      throw new NotFoundError("Session not found");
    }
    if (session.humanActive) {
      return { success: true, humanActive: true, humanPending: false };
    }
    if (!session.humanPending) {
      await markSessionEscalated(
        Session,
        sessionId,
        session.projectId,
        session.visitorName,
        "Visitor requested support",
      );
    }
    return { success: true, humanPending: true, humanActive: false };
  });

  app.post("/api/v1/chat/message", async (req, reply) => {
    await requireClient(req);
    const body = chatMessageSchema.parse(req.body);
    const project = await prisma.project.findUnique({
      where: { id: req.projectId! },
      include: { owner: { select: { businessWebsite: true } } },
    });
    if (!project) throw new NotFoundError("Project not found");

    const planKey = (project.plan ?? "free") as PlanTier;
    const dailyLimit = PLAN_LIMITS[planKey].messagesPerDay;
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const todayCount = await prisma.usageEvent.count({
      where: {
        projectId: project.id,
        kind: "chat_message",
        createdAt: { gte: startOfToday },
      },
    });
    if (todayCount >= dailyLimit) {
      throw new AppError(
        `Daily limit of ${dailyLimit} messages reached for your ${planKey} plan. Upgrade or wait until tomorrow.`,
        429,
        "PLAN_LIMIT_EXCEEDED",
      );
    }

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

    if (!isValidSessionId(sessionId)) throw new NotFoundError("Session not found");
    const session = await Session.findById(sessionId);
    if (!session || session.projectId !== project.id) {
      throw new NotFoundError("Session not found");
    }

    if (session.humanActive && isHandoffStale(session)) {
      await releaseStaleHandoff(Session, sessionId, project.id);
      session.humanActive = false;
      session.agentId = undefined;
    }

    if (session.humanActive) {
      session.messages.push({ role: "user", content: body.message });
      await session.save();

      void publishInboxEvent(project.id, {
        type: "visitor_message",
        sessionId,
        content: body.message,
        at: new Date().toISOString(),
      });

      if (body.stream) {
        beginSseReply(req, reply);
        writeSseEvent(reply, { type: "meta", sessionId, humanActive: true });
        writeSseEvent(reply, { type: "done", toolsUsed: [] });
        endSse(reply);
        return;
      }
      return { success: true, sessionId, answer: "", humanActive: true, toolsUsed: [] };
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
        beginSseReply(req, reply);
        writeSseEvent(reply, { type: "meta", sessionId, confidence: "high" });
        for (const part of cached.match(/\S+\s*|\s+/g) ?? [cached]) {
          writeSseEvent(reply, { type: "token", content: part });
        }
        writeSseEvent(reply, { type: "done", toolsUsed: [] });
        endSse(reply);
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

    const chatRuntime = getProjectChatRuntime(project);
    const embeddingsRuntime = getProjectEmbeddingsRuntime(project);
    const embeddings = createEmbeddingsClient(embeddingsRuntime);
    const chat = createChatClient(chatRuntime);
    const history = session.messages.slice(-10).map((m) => ({
      role:
        m.role === "assistant" || m.role === "agent" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    }));

    const userMsgCount = session.messages.filter((m) => m.role === "user").length;
    const isFirstUserMessage = userMsgCount === 0;

    const ragOpts = {
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
    };

    if (body.stream) {
      beginSseReply(req, reply);
      writeSseEvent(reply, { type: "meta", sessionId });

      let accumulatedAnswer = "";
      let preamble!: AgentStreamPreamble;

      try {
        const gen = runAgenticRagStream(ragOpts);
        let next = await gen.next();
        while (!next.done) {
          accumulatedAnswer += next.value;
          writeSseEvent(reply, { type: "token", content: next.value });
          next = await gen.next();
        }
        preamble = next.value;
      } catch (err) {
        const message = userFacingChatError(err);
        req.log.error({ err }, "chat RAG stream failed");
        streamError(reply, message);
        return;
      }

      const stillBot = await isStillBotControlled(Session, sessionId);
      const escalated = didEscalate(preamble.eventsEmitted);

      session.messages.push({ role: "user", content: body.message });
      session.messages.push({
        role: "assistant",
        content: accumulatedAnswer,
        meta: {
          confidence: preamble.confidence,
          topScore: preamble.retrievalTopScore,
          toolsUsed: preamble.toolsUsed,
          events: preamble.eventsEmitted.map((e) => e.type),
          ...(stillBot ? {} : { suppressed: true }),
        },
      });
      if (escalated && stillBot && !session.humanActive) {
        session.humanPending = true;
        session.escalatedAt = new Date();
      }
      await session.save();

      void scheduleSessionReview({ projectId: project.id, sessionId });

      if (escalated && stillBot) {
        void publishInboxEvent(project.id, {
          type: "escalation",
          sessionId,
          visitorName: session.visitorName,
          message: body.message,
          at: new Date().toISOString(),
        });
      }

      void collectAndEmitChatEvents({
        projectId: project.id,
        sessionId,
        visitor: { name: session.visitorName, email: session.visitorEmail },
        userMessage: body.message,
        assistantAnswer: accumulatedAnswer,
        confidence: preamble.confidence,
        toolsUsed: preamble.toolsUsed,
        chunkCount: preamble.chunks.length,
        topScore: preamble.retrievalTopScore,
        isFirstUserMessage,
        agentEvents: preamble.eventsEmitted.map((e) => ({
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
        if (preamble.confidence !== "low" && stillBot) {
          await setCachedAnswer(redis, project.id, body.message, accumulatedAnswer);
        }
        await pushSessionMemory(redis, sessionId, `U:${body.message}\nA:${accumulatedAnswer}`);
      } catch {
        // ignore cache errors
      }

      await prisma.usageEvent.create({
        data: {
          projectId: project.id,
          kind: "chat_message",
          units: 1,
          meta: { confidence: preamble.confidence, toolsUsed: preamble.toolsUsed },
        },
      });

      writeSseEvent(reply, {
        type: "done",
        toolsUsed: preamble.toolsUsed,
        handoffPending: escalated && stillBot,
      });
      endSse(reply);
      return;
    }

    let result;
    try {
      result = await runAgenticRag(ragOpts);
    } catch (err) {
      const message = userFacingChatError(err);
      req.log.error({ err }, "chat RAG failed");
      return reply.status(503).send({
        success: false,
        code: "CHAT_FAILED",
        message,
        sessionId,
      });
    }

    const stillBot = await isStillBotControlled(Session, sessionId);
    const escalated = didEscalate(result.eventsEmitted);

    session.messages.push({ role: "user", content: body.message });
    session.messages.push({
      role: "assistant",
      content: result.answer,
      meta: {
        confidence: result.confidence,
        topScore: result.retrievalTopScore,
        toolsUsed: result.toolsUsed,
        events: result.eventsEmitted.map((e) => e.type),
        ...(stillBot ? {} : { suppressed: true }),
      },
    });
    if (escalated && stillBot && !session.humanActive) {
      session.humanPending = true;
      session.escalatedAt = new Date();
    }
    await session.save();

    void scheduleSessionReview({ projectId: project.id, sessionId });

    if (escalated && stillBot) {
      void publishInboxEvent(project.id, {
        type: "escalation",
        sessionId,
        visitorName: session.visitorName,
        message: body.message,
        at: new Date().toISOString(),
      });
    }

    void collectAndEmitChatEvents({
      projectId: project.id,
      sessionId,
      visitor: { name: session.visitorName, email: session.visitorEmail },
      userMessage: body.message,
      assistantAnswer: result.answer,
      confidence: result.confidence,
      toolsUsed: result.toolsUsed,
      chunkCount: result.chunks.length,
      topScore: result.retrievalTopScore,
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
      if (result.confidence !== "low" && stillBot) {
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

    if (!stillBot) {
      return { success: true, sessionId, answer: "", humanActive: true, toolsUsed: [] };
    }

    return {
      success: true,
      sessionId,
      answer: result.answer,
      cached: false,
      confidence: result.confidence,
      toolsUsed: result.toolsUsed,
      handoffPending: escalated,
      sources: result.chunks.map((c) => ({ id: c.id, score: c.score })),
    };
  });
}
