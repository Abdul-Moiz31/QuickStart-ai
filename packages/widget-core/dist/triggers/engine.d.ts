import type { ProactiveTriggerRule, ProactiveTriggersConfig } from "./types.js";
export interface TriggerEngineOptions {
    onFire: (rule: ProactiveTriggerRule) => void;
    /** Defaults to window.sessionStorage. Injectable so tests don't need a real browser. */
    sessionStorage?: Storage;
    /** Defaults to window.localStorage. Injectable so tests don't need a real browser. */
    localStorage?: Storage;
    /** Defaults to Date.now. Injectable for deterministic tests. */
    now?: () => number;
}
/**
 * Evaluates a project's proactive-trigger rules against live page signals (time on
 * page, idle time, URL, scroll depth, exit intent) and fires each rule at most once
 * per browser session, subject to a daily cap shared across all rules.
 *
 * Framework-agnostic on purpose: widget-react and widget-vanilla both drive their
 * own open/message state from `onFire`, so the polling/listener logic lives once.
 */
export declare class TriggerEngine {
    private readonly rules;
    private readonly maxFiresPerDay;
    private readonly onFire;
    private readonly session;
    private readonly local;
    private readonly now;
    private startedAt;
    private lastActivityAt;
    private exitIntent;
    private lastScrollY;
    private tickHandle;
    private readonly firedRuleIds;
    private readonly handleMouseOut;
    private readonly handleActivity;
    private readonly handleScroll;
    constructor(config: ProactiveTriggersConfig, options: TriggerEngineOptions);
    start(): void;
    stop(): void;
    private currentState;
    private tick;
}
//# sourceMappingURL=engine.d.ts.map