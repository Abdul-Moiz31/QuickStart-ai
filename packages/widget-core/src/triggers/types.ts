export type TriggerCondition =
  | { type: "time_on_page"; seconds: number }
  | { type: "url_match"; pattern: string }
  | { type: "exit_intent" }
  | { type: "scroll_depth"; percent: number }
  | { type: "idle"; seconds: number };

export interface ProactiveTriggerRule {
  id: string;
  message: string;
  enabled?: boolean;
  /** All conditions must hold for the rule to fire ("AND" combinators). */
  conditions: TriggerCondition[];
}

export interface ProactiveTriggersConfig {
  /** Caps total proactive fires per visitor per day, across all rules. Default 3. */
  maxFiresPerDay?: number;
  rules: ProactiveTriggerRule[];
}

/** Point-in-time signals the engine evaluates each rule's conditions against. */
export interface TriggerState {
  elapsedSeconds: number;
  idleSeconds: number;
  pathname: string;
  scrollPercent: number;
  exitIntent: boolean;
}
