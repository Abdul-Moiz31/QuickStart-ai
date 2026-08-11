import { BUILTIN_EVENT_TYPES } from "@quickstart-ai/shared";
import type { DomainEventInput } from "./types.js";

const ISSUE_PATTERN =
  /\b(bug|broken|not working|doesn't work|does not work|error|issue|problem|crash|failed)\b/i;

export function detectHeuristicEvents(ctx: {
  userMessage: string;
  confidence: "high" | "medium" | "low";
  chunkCount: number;
  sessionId: string;
}): DomainEventInput[] {
  const events: DomainEventInput[] = [];

  if (ctx.confidence === "low" && ctx.chunkCount === 0) {
    events.push({
      type: BUILTIN_EVENT_TYPES.KNOWLEDGE_GAP,
      source: "heuristic",
      sessionId: ctx.sessionId,
      payload: {
        message: ctx.userMessage,
        confidence: ctx.confidence,
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
