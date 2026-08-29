import { randomUUID } from "node:crypto";
import { prisma } from "@quickstart-ai/db";
import { BUILTIN_EVENT_TYPES } from "@quickstart-ai/shared";
import { detectHeuristicEvents } from "./heuristics.js";
import { persistAndEnqueueEvents } from "./emit.js";
import { buildCustomEventsFromRules } from "./rules.js";
import type { ChatEventContext, DomainEventInput } from "./types.js";

export async function collectAndEmitChatEvents(
  ctx: ChatEventContext & { redisUrl: string; webAppUrl?: string },
): Promise<string[]> {
  const events: DomainEventInput[] = [...ctx.agentEvents];

  if (ctx.isFirstUserMessage) {
    events.push({
      type: BUILTIN_EVENT_TYPES.CONVERSATION_STARTED,
      source: "builtin",
      sessionId: ctx.sessionId,
      payload: {
        visitor: ctx.visitor,
        first_message: ctx.userMessage,
      },
    });
  }

  events.push(
    ...detectHeuristicEvents({
      userMessage: ctx.userMessage,
      confidence: ctx.confidence,
      chunkCount: ctx.chunkCount,
      topScore: ctx.topScore,
      sessionId: ctx.sessionId,
      assistantEvents: ctx.agentEvents.map((e) => e.type),
    }),
  );

  const rules = await prisma.eventRule.findMany({
    where: { projectId: ctx.projectId, enabled: true },
    select: { name: true, description: true, eventType: true, triggers: true },
  });

  events.push(
    ...buildCustomEventsFromRules(rules, {
      userMessage: ctx.userMessage,
      confidence: ctx.confidence,
      toolsUsed: ctx.toolsUsed,
      intents: [],
      sessionId: ctx.sessionId,
    }),
  );

  const enriched = events.map((ev) => ({
    ...ev,
    // A conversation can produce many weak turns — greetings and small talk score
    // low against any knowledge base. dedupeEvents only collapses within a single
    // turn, and the derived idempotency key includes the message, so without a
    // session-scoped key every "hi" would reach Slack as its own gap.
    ...(ev.type === BUILTIN_EVENT_TYPES.KNOWLEDGE_GAP
      ? { idempotencyKey: `${ctx.projectId}:knowledge.gap:${ctx.sessionId}` }
      : {}),
    sessionId: ctx.sessionId,
    payload: {
      ...ev.payload,
      visitor: ctx.visitor,
      message: ctx.userMessage,
      assistant_answer: ctx.assistantAnswer,
      confidence: ctx.confidence,
      tools_used: ctx.toolsUsed,
    },
  }));

  const deduped = dedupeEvents(enriched);
  return persistAndEnqueueEvents({
    projectId: ctx.projectId,
    events: deduped,
    redisUrl: ctx.redisUrl,
  });
}

function dedupeEvents(events: DomainEventInput[]): DomainEventInput[] {
  const seen = new Set<string>();
  const out: DomainEventInput[] = [];
  for (const ev of events) {
    const key = `${ev.type}:${ev.sessionId ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ev);
  }
  return out;
}

export async function emitTestEvent(opts: {
  projectId: string;
  type: string;
  redisUrl: string;
  sessionId?: string;
}): Promise<string | null> {
  const ids = await persistAndEnqueueEvents({
    projectId: opts.projectId,
    events: [
      {
        type: opts.type,
        source: "test",
        sessionId: opts.sessionId,
        payload: {
          test: true,
          message: "This is a test event from QuickStart AI Integrations.",
          nonce: randomUUID(),
        },
        idempotencyKey: `test:${opts.projectId}:${randomUUID()}`,
      },
    ],
    redisUrl: opts.redisUrl,
  });
  return ids[0] ?? null;
}
