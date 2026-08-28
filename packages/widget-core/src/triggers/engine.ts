import { evaluateRule } from "./evaluate.js";
import {
  hasFiredThisSession,
  isDailyCapExceeded,
  markFiredThisSession,
  recordDailyFire,
} from "./storage.js";
import type { ProactiveTriggerRule, ProactiveTriggersConfig, TriggerState } from "./types.js";

const TICK_MS = 500;
/** Fast upward scroll near the top of the page — the closest a touch device gets to exit intent. */
const MOBILE_EXIT_SCROLL_DELTA = 80;
const MOBILE_EXIT_SCROLL_MAX_Y = 400;

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
export class TriggerEngine {
  private readonly rules: ProactiveTriggerRule[];
  private readonly maxFiresPerDay: number;
  private readonly onFire: (rule: ProactiveTriggerRule) => void;
  private readonly session: Storage;
  private readonly local: Storage;
  private readonly now: () => number;

  private startedAt = 0;
  private lastActivityAt = 0;
  private exitIntent = false;
  private lastScrollY = 0;
  private tickHandle: ReturnType<typeof setInterval> | null = null;
  private readonly firedRuleIds = new Set<string>();

  private readonly handleMouseOut = (e: MouseEvent) => {
    if (e.clientY <= 0 && !e.relatedTarget) this.exitIntent = true;
  };

  private readonly handleActivity = () => {
    this.lastActivityAt = this.now();
  };

  private readonly handleScroll = () => {
    this.handleActivity();
    const y = window.scrollY;
    if (y < this.lastScrollY - MOBILE_EXIT_SCROLL_DELTA && y < MOBILE_EXIT_SCROLL_MAX_Y) {
      this.exitIntent = true;
    }
    this.lastScrollY = y;
  };

  constructor(config: ProactiveTriggersConfig, options: TriggerEngineOptions) {
    this.rules = config.rules;
    this.maxFiresPerDay = config.maxFiresPerDay ?? 3;
    this.onFire = options.onFire;
    this.session = options.sessionStorage ?? (typeof window !== "undefined" ? window.sessionStorage : (undefined as never));
    this.local = options.localStorage ?? (typeof window !== "undefined" ? window.localStorage : (undefined as never));
    this.now = options.now ?? (() => Date.now());
  }

  start(): void {
    if (this.tickHandle) return;
    if (typeof window === "undefined" || typeof document === "undefined") return;
    if (this.rules.length === 0) return;

    this.startedAt = this.now();
    this.lastActivityAt = this.startedAt;
    this.lastScrollY = window.scrollY;
    this.exitIntent = false;

    for (const rule of this.rules) {
      if (hasFiredThisSession(this.session, rule.id)) this.firedRuleIds.add(rule.id);
    }

    document.addEventListener("mouseout", this.handleMouseOut);
    window.addEventListener("scroll", this.handleScroll, { passive: true });
    window.addEventListener("mousemove", this.handleActivity);
    window.addEventListener("keydown", this.handleActivity);
    window.addEventListener("touchstart", this.handleActivity, { passive: true });

    this.tickHandle = setInterval(() => this.tick(), TICK_MS);
    this.tick();
  }

  stop(): void {
    if (this.tickHandle) clearInterval(this.tickHandle);
    this.tickHandle = null;
    if (typeof window === "undefined" || typeof document === "undefined") return;
    document.removeEventListener("mouseout", this.handleMouseOut);
    window.removeEventListener("scroll", this.handleScroll);
    window.removeEventListener("mousemove", this.handleActivity);
    window.removeEventListener("keydown", this.handleActivity);
    window.removeEventListener("touchstart", this.handleActivity);
  }

  private currentState(): TriggerState {
    const now = this.now();
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const scrollPercent = scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0;
    return {
      elapsedSeconds: (now - this.startedAt) / 1000,
      idleSeconds: (now - this.lastActivityAt) / 1000,
      pathname: window.location.pathname,
      scrollPercent,
      exitIntent: this.exitIntent,
    };
  }

  private tick(): void {
    const state = this.currentState();
    for (const rule of this.rules) {
      if (this.firedRuleIds.has(rule.id)) continue;
      if (!evaluateRule(rule, state)) continue;
      if (isDailyCapExceeded(this.local, this.maxFiresPerDay, this.now())) continue;

      this.firedRuleIds.add(rule.id);
      markFiredThisSession(this.session, rule.id);
      recordDailyFire(this.local, this.now());
      this.onFire(rule);
    }
  }
}
