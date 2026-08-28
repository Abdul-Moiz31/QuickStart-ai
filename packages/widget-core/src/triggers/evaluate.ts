import type { ProactiveTriggerRule, TriggerCondition, TriggerState } from "./types.js";

/**
 * "/pricing" matches the exact path or anything nested under it ("/pricing/enterprise"),
 * so a rule scoped to a section doesn't silently miss its sub-pages. "*" is a wildcard
 * matched via regex; anything else is an exact/prefix match.
 */
export function matchesUrlPattern(pathname: string, pattern: string): boolean {
  if (pattern.includes("*")) {
    const escaped = pattern
      .split("*")
      .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
      .join(".*");
    return new RegExp(`^${escaped}$`).test(pathname);
  }
  return pathname === pattern || pathname.startsWith(pattern.endsWith("/") ? pattern : `${pattern}/`);
}

export function evaluateCondition(condition: TriggerCondition, state: TriggerState): boolean {
  switch (condition.type) {
    case "time_on_page":
      return state.elapsedSeconds >= condition.seconds;
    case "idle":
      return state.idleSeconds >= condition.seconds;
    case "url_match":
      return matchesUrlPattern(state.pathname, condition.pattern);
    case "scroll_depth":
      return state.scrollPercent >= condition.percent;
    case "exit_intent":
      return state.exitIntent;
  }
}

export function evaluateRule(rule: ProactiveTriggerRule, state: TriggerState): boolean {
  if (rule.enabled === false) return false;
  if (rule.conditions.length === 0) return false;
  return rule.conditions.every((condition) => evaluateCondition(condition, state));
}
