import { evaluateRule } from "./evaluate.js";
import { hasFiredThisSession, isDailyCapExceeded, markFiredThisSession, recordDailyFire, } from "./storage.js";
const TICK_MS = 500;
/** Fast upward scroll near the top of the page — the closest a touch device gets to exit intent. */
const MOBILE_EXIT_SCROLL_DELTA = 80;
const MOBILE_EXIT_SCROLL_MAX_Y = 400;
/**
 * Evaluates a project's proactive-trigger rules against live page signals (time on
 * page, idle time, URL, scroll depth, exit intent) and fires each rule at most once
 * per browser session, subject to a daily cap shared across all rules.
 *
 * Framework-agnostic on purpose: widget-react and widget-vanilla both drive their
 * own open/message state from `onFire`, so the polling/listener logic lives once.
 */
export class TriggerEngine {
    rules;
    maxFiresPerDay;
    onFire;
    session;
    local;
    now;
    startedAt = 0;
    lastActivityAt = 0;
    exitIntent = false;
    lastScrollY = 0;
    tickHandle = null;
    firedRuleIds = new Set();
    handleMouseOut = (e) => {
        if (e.clientY <= 0 && !e.relatedTarget)
            this.exitIntent = true;
    };
    handleActivity = () => {
        this.lastActivityAt = this.now();
    };
    handleScroll = () => {
        this.handleActivity();
        const y = window.scrollY;
        if (y < this.lastScrollY - MOBILE_EXIT_SCROLL_DELTA && y < MOBILE_EXIT_SCROLL_MAX_Y) {
            this.exitIntent = true;
        }
        this.lastScrollY = y;
    };
    constructor(config, options) {
        this.rules = config.rules;
        this.maxFiresPerDay = config.maxFiresPerDay ?? 3;
        this.onFire = options.onFire;
        this.session = options.sessionStorage ?? (typeof window !== "undefined" ? window.sessionStorage : undefined);
        this.local = options.localStorage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
        this.now = options.now ?? (() => Date.now());
    }
    start() {
        if (this.tickHandle)
            return;
        if (typeof window === "undefined" || typeof document === "undefined")
            return;
        if (this.rules.length === 0)
            return;
        this.startedAt = this.now();
        this.lastActivityAt = this.startedAt;
        this.lastScrollY = window.scrollY;
        this.exitIntent = false;
        for (const rule of this.rules) {
            if (hasFiredThisSession(this.session, rule.id))
                this.firedRuleIds.add(rule.id);
        }
        document.addEventListener("mouseout", this.handleMouseOut);
        window.addEventListener("scroll", this.handleScroll, { passive: true });
        window.addEventListener("mousemove", this.handleActivity);
        window.addEventListener("keydown", this.handleActivity);
        window.addEventListener("touchstart", this.handleActivity, { passive: true });
        this.tickHandle = setInterval(() => this.tick(), TICK_MS);
        this.tick();
    }
    stop() {
        if (this.tickHandle)
            clearInterval(this.tickHandle);
        this.tickHandle = null;
        if (typeof window === "undefined" || typeof document === "undefined")
            return;
        document.removeEventListener("mouseout", this.handleMouseOut);
        window.removeEventListener("scroll", this.handleScroll);
        window.removeEventListener("mousemove", this.handleActivity);
        window.removeEventListener("keydown", this.handleActivity);
        window.removeEventListener("touchstart", this.handleActivity);
    }
    currentState() {
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
    tick() {
        const state = this.currentState();
        for (const rule of this.rules) {
            if (this.firedRuleIds.has(rule.id))
                continue;
            if (!evaluateRule(rule, state))
                continue;
            if (isDailyCapExceeded(this.local, this.maxFiresPerDay, this.now()))
                continue;
            this.firedRuleIds.add(rule.id);
            markFiredThisSession(this.session, rule.id);
            recordDailyFire(this.local, this.now());
            this.onFire(rule);
        }
    }
}
//# sourceMappingURL=engine.js.map