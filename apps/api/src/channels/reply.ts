import type { FastifyBaseLogger } from "fastify";
import { connectMongo, getChatSessionModel, prisma } from "@quickstart-ai/db";
import {
  createChatClient,
  createEmbeddingsClient,
  getCachedAnswer,
  pushSessionMemory,
  runAgenticRag,
  setCachedAnswer,
  type QuickReplyOptions,
} from "@quickstart-ai/rag";
import { collectAndEmitChatEvents } from "@quickstart-ai/events";
import { BUILTIN_EVENT_TYPES, PLAN_LIMITS, type PlanTier } from "@quickstart-ai/shared";
import { getProjectChatRuntime, getProjectEmbeddingsRuntime } from "../project-llm.js";
import { getRedis, assertRateLimit } from "../redis.js";
import { publishInboxEvent } from "../realtime.js";
import { isHandoffStale, releaseStaleHandoff } from "../handoff.js";
import { env } from "../env.js";

export type ChannelName = "sms" | "whatsapp" | "instagram";

export type ChannelReplyResult =
  | { kind: "no_project" }
  | { kind: "plan_limit" }
  | { kind: "rate_limited" }
  | { kind: "human_active" }
  | { kind: "error"; message: string }
  | { kind: "answer"; answer: string; escalated: boolean; quickReplies?: QuickReplyOptions };

/** Placeholder visitor identity for channels that don't collect a name/email up front. */
function placeholderVisitor(channel: ChannelName, externalId: string) {
  const safeId = externalId.replace(/[^a-zA-Z0-9]/g, "");
  return {
    visitorName: externalId,
    visitorEmail: `${safeId || "visitor"}@${channel}.quickstart.local`,
  };
}

async function findOrCreateChannelSession(
  Session: ReturnType<typeof getChatSessionModel>,
  projectId: string,
  channel: ChannelName,
  externalId: string,
) {
  const existing = await Session.findOne({ projectId, channel, externalId });
  if (existing) return existing;
  const { visitorName, visitorEmail } = placeholderVisitor(channel, externalId);
  return Session.create({
    projectId,
    channel,
    externalId,
    visitorName,
    visitorEmail,
    messages: [],
  });
}

/**
 * Runs one inbound channel message through the same RAG pipeline the web
 * widget uses (apps/api/src/routes/chat.ts), against a session found/created
 * by (projectId, channel, externalId) instead of a client-held sessionId.
 */
export async function runChannelMessage(opts: {
  projectId: string;
  channel: ChannelName;
  externalId: string;
  message: string;
  log: FastifyBaseLogger;
  rateLimit: { key: string; limit: number; windowMs: number };
}): Promise<ChannelReplyResult> {
  const rl = await assertRateLimit(opts.rateLimit.key, opts.rateLimit.limit, opts.rateLimit.windowMs);
  if (!rl.allowed) return { kind: "rate_limited" };

  const project = await prisma.project.findUnique({
    where: { id: opts.projectId },
    include: { owner: { select: { businessWebsite: true } } },
  });
  if (!project) return { kind: "no_project" };

  const planKey = (project.plan ?? "free") as PlanTier;
  const dailyLimit = PLAN_LIMITS[planKey].messagesPerDay;
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const todayCount = await prisma.usageEvent.count({
    where: { projectId: project.id, kind: "chat_message", createdAt: { gte: startOfToday } },
  });
  if (todayCount >= dailyLimit) return { kind: "plan_limit" };

  await connectMongo();
  const Session = getChatSessionModel();
  const session = await findOrCreateChannelSession(Session, project.id, opts.channel, opts.externalId);

  if (session.humanActive && isHandoffStale(session)) {
    await releaseStaleHandoff(Session, String(session._id), project.id);
    session.humanActive = false;
    session.agentId = undefined;
  }

  if (session.humanActive) {
    session.messages.push({ role: "user", content: opts.message });
    await session.save();
    void publishInboxEvent(project.id, {
      type: "visitor_message",
      sessionId: String(session._id),
      content: opts.message,
      at: new Date().toISOString(),
    });
    return { kind: "human_active" };
  }

  const redis = getRedis();
  try {
    if (redis.status !== "ready") await redis.connect();
  } catch {
    // continue without cache
  }

  let cached: string | null = null;
  try {
    cached = await getCachedAnswer(redis, project.id, opts.message);
  } catch {
    cached = null;
  }

  if (cached) {
    session.messages.push({ role: "user", content: opts.message });
    session.messages.push({ role: "assistant", content: cached, meta: { cached: true } });
    await session.save();
    return { kind: "answer", answer: cached, escalated: false };
  }

  const chatRuntime = getProjectChatRuntime(project);
  const embeddingsRuntime = getProjectEmbeddingsRuntime(project);
  const embeddings = createEmbeddingsClient(embeddingsRuntime);
  const chat = createChatClient(chatRuntime);
  const history = session.messages.slice(-10).map((m) => ({
    role: m.role === "assistant" || m.role === "agent" ? ("assistant" as const) : ("user" as const),
    content: m.content,
  }));
  const isFirstUserMessage = session.messages.filter((m) => m.role === "user").length === 0;

  const ragOpts = {
    projectId: project.id,
    projectName: project.name,
    systemPrompt: project.systemPrompt || undefined,
    query: opts.message,
    history,
    embeddings,
    chat,
    toolsWebSearch: project.toolsWebSearch,
    toolsHumanHandoff: project.toolsHumanHandoff,
    toolsLeadCapture: project.toolsLeadCapture,
    businessWebsite: project.owner?.businessWebsite ?? undefined,
    visitorName: session.visitorName,
    visitorEmail: session.visitorEmail,
    toolsInteractiveReplies: opts.channel === "whatsapp",
  };

  let result;
  try {
    result = await runAgenticRag(ragOpts);
  } catch (err) {
    opts.log.error({ err }, `channel RAG failed (${opts.channel})`);
    return { kind: "error", message: "Sorry, something went wrong. Please try again." };
  }

  const escalated = result.eventsEmitted.some((e) => e.type === BUILTIN_EVENT_TYPES.HUMAN_HANDOFF);
  const sessionId = String(session._id);

  session.messages.push({ role: "user", content: opts.message });
  session.messages.push({
    role: "assistant",
    content: result.answer,
    meta: {
      confidence: result.confidence,
      topScore: result.retrievalTopScore,
      toolsUsed: result.toolsUsed,
      events: result.eventsEmitted.map((e) => e.type),
    },
  });
  if (escalated && !session.humanActive) {
    session.humanPending = true;
    session.escalatedAt = new Date();
  }
  await session.save();

  if (escalated) {
    void publishInboxEvent(project.id, {
      type: "escalation",
      sessionId,
      visitorName: session.visitorName,
      message: opts.message,
      at: new Date().toISOString(),
    });
  }

  void collectAndEmitChatEvents({
    projectId: project.id,
    sessionId,
    visitor: { name: session.visitorName, email: session.visitorEmail },
    userMessage: opts.message,
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
  }).catch((err) => opts.log.error({ err }, "channel event emit failed"));

  try {
    if (result.confidence !== "low") {
      await setCachedAnswer(redis, project.id, opts.message, result.answer);
    }
    await pushSessionMemory(redis, sessionId, `U:${opts.message}\nA:${result.answer}`);
  } catch {
    // ignore cache errors
  }

  await prisma.usageEvent.create({
    data: {
      projectId: project.id,
      kind: "chat_message",
      units: 1,
      meta: { confidence: result.confidence, toolsUsed: result.toolsUsed, channel: opts.channel },
    },
  });

  return { kind: "answer", answer: result.answer, escalated, quickReplies: result.quickReplies };
}
