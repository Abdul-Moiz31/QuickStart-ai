import type { ProactiveTriggerRule, TriggerCondition, TriggerState } from "./types.js";
/**
 * "/pricing" matches the exact path or anything nested under it ("/pricing/enterprise"),
 * so a rule scoped to a section doesn't silently miss its sub-pages. "*" is a wildcard
 * matched via regex; anything else is an exact/prefix match.
 */
export declare function matchesUrlPattern(pathname: string, pattern: string): boolean;
export declare function evaluateCondition(condition: TriggerCondition, state: TriggerState): boolean;
export declare function evaluateRule(rule: ProactiveTriggerRule, state: TriggerState): boolean;
//# sourceMappingURL=evaluate.d.ts.map