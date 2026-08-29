/** A rule that already fired in this tab session never fires again, even across page navigation. */
export declare function hasFiredThisSession(storage: Storage, ruleId: string): boolean;
export declare function markFiredThisSession(storage: Storage, ruleId: string): void;
/** Whether firing one more proactive trigger today would exceed the visitor's daily cap. */
export declare function isDailyCapExceeded(storage: Storage, maxPerDay: number, now: number): boolean;
export declare function recordDailyFire(storage: Storage, now: number): void;
//# sourceMappingURL=storage.d.ts.map