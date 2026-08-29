import type { EventRuleTrigger, DomainEventInput } from "./types.js";

export function matchesTrigger(
  trigger: EventRuleTrigger,
  ctx: {
    userMessage: string;
    confidence: "high" | "medium" | "low";
    toolsUsed: string[];
    intents: string[];
  },
): boolean {
  switch (trigger.type) {
    case "keyword": {
      const lower = ctx.userMessage.toLowerCase();
      return (trigger.keywords ?? []).some((k) => lower.includes(k.toLowerCase()));
    }
    case "regex": {
      try {
        return new RegExp(trigger.pattern ?? "", "i").test(ctx.userMessage);
      } catch {
        return false;
      }
    }
    case "tool":
      return ctx.toolsUsed.includes(trigger.toolName ?? "");
    case "confidence":
      return trigger.maxConfidence === "low"
        ? ctx.confidence === "low"
        : ctx.confidence === "low" || ctx.confidence === "medium";
    case "intent":
      return (trigger.intents ?? []).some((i) =>
        ctx.intents.some((found) => found.toLowerCase() === i.toLowerCase()),
      );
    default:
      return false;
  }
}

export function buildCustomEventsFromRules(
  rules: Array<{
    name: string;
    description: string;
    eventType: string;
    triggers: unknown;
  }>,
  ctx: {
    userMessage: string;
    confidence: "high" | "medium" | "low";
    toolsUsed: string[];
    intents: string[];
    sessionId: string;
  },
): DomainEventInput[] {
  const out: DomainEventInput[] = [];
  for (const rule of rules) {
    const trigger = rule.triggers as EventRuleTrigger;
    if (!trigger?.type) continue;
    if (!matchesTrigger(trigger, ctx)) continue;
    out.push({
      type: rule.eventType,
      name: rule.name,
      description: rule.description,
      source: "custom",
      sessionId: ctx.sessionId,
      payload: {
        message: ctx.userMessage,
        confidence: ctx.confidence,
        toolsUsed: ctx.toolsUsed,
        intents: ctx.intents,
        ruleName: rule.name,
      },
    });
  }
  return out;
}
