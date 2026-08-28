import type { FastifyInstance } from "fastify";
import { connectMongo, getChatSessionModel, isValidSessionId, prisma } from "@quickstart-ai/db";
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
import { getProjectLlmRuntime } from "../project-llm.js";
import { getRedis } from "../redis.js";
import { publishInboxEvent } from "../realtime.js";
import { isHandoffStale, releaseStaleHandoff } from "../handoff.js";
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

/**
 * The handoff flag is set inline rather than from the event pipeline:
 * collectAndEmitChatEvents is fire-and-forget over BullMQ and dedupes on
 * type+sessionId — right for notifying Slack, wrong for state the next request reads.
 */
function didEscalate(events: { type: string }[]): boolean {
  return events.some((e) => e.type === BUILTIN_EVENT_TYPES.HUMAN_HANDOFF);
}

/**
 * The guard at the top of the request describes the past: an agent can take over
 * while the model is still generating, so it is re-checked at write time.
 */
async function isStillBotControlled(
  Session: ReturnType<typeof getChatSessionModel>,
  sessionId: string,
): Promise<boolean> {
  const fresh = await Session.findById(sessionId).select("humanActive").lean();
  return !fresh?.humanActive;
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
        proactiveTriggers: project.proactiveTriggers,
      },
    };
  });

  /**
   * Transcript for one session. Pub/sub has no replay, so anything published while
   * the widget's stream was down is only recoverable from here.
   */
  app.get("/api/v1/chat/sessions/:sessionId/messages", async (req) => {
    await requireClient(req, { touch: false });
    const { sessionId } = req.params as { sessionId: string };
    if (!isValidSessionId(sessionId)) throw new NotFoundError("Session not found");
    await connectMongo();
    const Session = getChatSessionModel();
    const session = await Session.findById(sessionId)
      .select("projectId humanActive messages")
      .lean();
    if (!session || session.projectId !== req.projectId) {
      throw new NotFoundError("Session not found");
    }
    return {
      success: true,
      humanActive: Boolean(session.humanActive),
      messages: (session.messages ?? [])
        // System and tool turns are internal plumbing.
        .filter((m) => m.role !== "system" && m.role !== "tool")
        // Superseded answers were never delivered; replaying them would surface a
        // reply the visitor was deliberately not shown.
        .filter((m) => !(m.meta as { suppressed?: boolean } | undefined)?.suppressed)
        .map((m) => ({ role: m.role, content: m.content })),
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

    // Enforce daily message limit based on the project's plan
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

    // Nobody has worked this conversation for a while: hand it back rather than
    // leave the visitor with a widget that never answers again.
    if (session.humanActive && isHandoffStale(session)) {
      await releaseStaleHandoff(Session, sessionId, project.id);
      session.humanActive = false;
      session.agentId = undefined;
    }

    // Deliberately above the cache lookup: the answer cache is keyed by project and
    // question, not by session, so an entry populated by a different visitor would
    // otherwise be served over a live agent.
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
        reply.header("Content-Type", "text/event-stream");
        reply.header("Cache-Control", "no-cache");
        reply.raw.write(
          `data: ${JSON.stringify({ type: "meta", sessionId, humanActive: true })}\n\n`,
        );
        reply.raw.write(`data: ${JSON.stringify({ type: "done", toolsUsed: [] })}\n\n`);
        reply.raw.end();
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
    // Agent turns map to assistant so a resuming bot reads them as its own prior
    // turns; the default branch would feed them back as visitor messages.
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

    // ── Streaming path ────────────────────────────────────────────────────────
    if (body.stream) {
      reply.header("Content-Type", "text/event-stream");
      reply.header("Cache-Control", "no-cache");
      reply.raw.write(`data: ${JSON.stringify({ type: "meta", sessionId })}\n\n`);

      let accumulatedAnswer = "";
      let preamble!: AgentStreamPreamble;

      try {
        const gen = runAgenticRagStream(ragOpts);
        let next = await gen.next();
        while (!next.done) {
          accumulatedAnswer += next.value;
          reply.raw.write(`data: ${JSON.stringify({ type: "token", content: next.value })}\n\n`);
          next = await gen.next();
        }
        preamble = next.value;
      } catch (err) {
        const message = userFacingChatError(err);
        req.log.error({ err }, "chat RAG stream failed");
        streamError(reply, message);
        return;
      }

      // Kept but not delivered, so "why did the bot go quiet" stays diagnosable.
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

      reply.raw.write(`data: ${JSON.stringify({ type: "done", toolsUsed: preamble.toolsUsed })}\n\n`);
      reply.raw.end();
      return;
    }

    // ── Non-streaming path ────────────────────────────────────────────────────
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

    // An agent claimed the session while the model was generating. The answer was
    // stored as suppressed; returning it anyway would talk over them.
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
      sources: result.chunks.map((c) => ({ id: c.id, score: c.score })),
    };
  });
}
