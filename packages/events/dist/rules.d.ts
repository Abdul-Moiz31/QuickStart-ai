import type { EventRuleTrigger, DomainEventInput } from "./types.js";
export declare function matchesTrigger(trigger: EventRuleTrigger, ctx: {
    userMessage: string;
    confidence: "high" | "medium" | "low";
    toolsUsed: string[];
    intents: string[];
}): boolean;
export declare function buildCustomEventsFromRules(rules: Array<{
    name: string;
    description: string;
    eventType: string;
    triggers: unknown;
}>, ctx: {
    userMessage: string;
    confidence: "high" | "medium" | "low";
    toolsUsed: string[];
    intents: string[];
    sessionId: string;
}): DomainEventInput[];
//# sourceMappingURL=rules.d.ts.map