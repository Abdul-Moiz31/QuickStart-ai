import { BUILTIN_EVENT_TYPES, KNOWLEDGE_GAP_TOP_SCORE } from "@quickstart-ai/shared";
import type { DomainEventInput } from "./types.js";

const ISSUE_PATTERN =
  /\b(bug|broken|not working|doesn't work|does not work|error|issue|problem|crash|failed)\b/i;

/**
 * Whether retrieval failed to find anything that actually answers the question.
 *
 * The previous test was `confidence === "low" && chunkCount === 0`, which never
 * fired: vectorSearch has no score floor, so a project with any knowledge always
 * gets topK rows back and chunkCount is never 0. The event has been silently dead
 * for every project that had a working bot.
 *
 * topScore is the honest measure — confidence averages all topK chunks, so an
 * irrelevant tail drags it down even when the top hit is strong. Callers without a
 * topScore fall back to the old averaged signal.
 */
function isKnowledgeGap(ctx: {
  confidence: "high" | "medium" | "low";
  chunkCount: number;
  topScore?: number;
}): boolean {
  if (typeof ctx.topScore === "number") return ctx.topScore < KNOWLEDGE_GAP_TOP_SCORE;
  return ctx.confidence === "low" && ctx.chunkCount === 0;
}

export function detectHeuristicEvents(ctx: {
  userMessage: string;
  confidence: "high" | "medium" | "low";
  chunkCount: number;
  topScore?: number;
  sessionId: string;
}): DomainEventInput[] {
  const events: DomainEventInput[] = [];

  if (isKnowledgeGap(ctx)) {
    events.push({
      type: BUILTIN_EVENT_TYPES.KNOWLEDGE_GAP,
      source: "heuristic",
      sessionId: ctx.sessionId,
      payload: {
        message: ctx.userMessage,
        confidence: ctx.confidence,
        top_score: ctx.topScore,
      },
    });
  }

  if (ISSUE_PATTERN.test(ctx.userMessage)) {
    events.push({
      type: BUILTIN_EVENT_TYPES.ISSUE_REPORTED,
      source: "heuristic",
      sessionId: ctx.sessionId,
      payload: {
        message: ctx.userMessage,
        summary: ctx.userMessage.slice(0, 280),
      },
    });
  }

  return events;
}
