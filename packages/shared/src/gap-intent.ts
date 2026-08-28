import { BUILTIN_EVENT_TYPES } from "./events.js";

/** Greetings and very short openers that rarely match FAQ content. */
const GREETING_PATTERN =
  /^(?:hi+|hey+|hello+|howdy|yo|sup|good\s+(?:morning|afternoon|evening)|greetings)[!.?\s]*$/i;

/** Short acknowledgments and filler — not actionable FAQ topics. */
const ACK_PATTERN =
  /^(?:(?:yes|yeah|yep|yup|ok(?:ay)?|sure|thanks?(?:\s+you)?|thank\s+you|no|nah|nope|please|cool|great|got\s+it|sounds\s+good)(?:\s+(?:yes|yeah|yep|yup|ok(?:ay)?|sure|please|thanks?|thank\s+you|no|nah|nope|cool|great))?)[!.?\s]*$/i;

/** Visitor wants a human or support — handoff, not a knowledge gap. */
const HANDOFF_PATTERN =
  /\b(?:(?:talk(?:\s+to|\s+with)?\s+(?:you|a\s+(?:person|human|agent|rep|representative|someone)))|(?:speak(?:\s+to|\s+with)?\s+(?:you|a\s+(?:person|human|agent|rep|representative|someone)))|(?:contact(?:\s+the)?\s+(?:support|human|agent|team|us))|(?:connect(?:\s+me)?\s+(?:to|with)\s+(?:support|human|agent|a\s+(?:person|human)|someone))|(?:human\s+(?:agent|support|help))|(?:live\s+(?:agent|support|chat|person))|(?:real\s+person)|(?:customer\s+(?:service|support))|(?:get\s+(?:me\s+)?(?:support|help\s+from\s+a\s+person)))\b/i;

const MAX_GREETING_LEN = 24;

export function normalizeGapQuestion(question: string): string {
  return question.trim().toLowerCase();
}

/**
 * Whether a user message should never count as a knowledge gap.
 * Covers greetings, acknowledgments, and handoff intent.
 */
export function isGapExcludedUserMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return true;
  if (trimmed.length <= MAX_GREETING_LEN && GREETING_PATTERN.test(trimmed)) return true;
  if (trimmed.length <= 40 && ACK_PATTERN.test(trimmed)) return true;
  if (HANDOFF_PATTERN.test(trimmed)) return true;
  return false;
}

/** Assistant turn already escalated to a human — not a KB coverage gap. */
export function isHandoffAssistantTurn(meta: { events?: string[] } | undefined): boolean {
  const events = meta?.events ?? [];
  return events.includes(BUILTIN_EVENT_TYPES.HUMAN_HANDOFF);
}

/**
 * Combined check used by gap collection and real-time heuristics.
 */
export function shouldExcludeFromGaps(
  userMessage: string,
  assistantMeta?: { events?: string[] },
): boolean {
  if (isGapExcludedUserMessage(userMessage)) return true;
  if (isHandoffAssistantTurn(assistantMeta)) return true;
  return false;
}
