const SESSION_FIRED_PREFIX = "qs_trigger_fired:";
const DAILY_COUNT_KEY = "qs_trigger_daily_count";
function todayKey(now) {
    return new Date(now).toISOString().slice(0, 10);
}
/** A rule that already fired in this tab session never fires again, even across page navigation. */
export function hasFiredThisSession(storage, ruleId) {
    return storage.getItem(SESSION_FIRED_PREFIX + ruleId) === "1";
}
export function markFiredThisSession(storage, ruleId) {
    storage.setItem(SESSION_FIRED_PREFIX + ruleId, "1");
}
function readDailyCount(storage, now) {
    const raw = storage.getItem(DAILY_COUNT_KEY);
    if (!raw)
        return { date: todayKey(now), count: 0 };
    try {
        const parsed = JSON.parse(raw);
        if (parsed.date !== todayKey(now))
            return { date: todayKey(now), count: 0 };
        return parsed;
    }
    catch {
        return { date: todayKey(now), count: 0 };
    }
}
/** Whether firing one more proactive trigger today would exceed the visitor's daily cap. */
export function isDailyCapExceeded(storage, maxPerDay, now) {
    return readDailyCount(storage, now).count >= maxPerDay;
}
export function recordDailyFire(storage, now) {
    const current = readDailyCount(storage, now);
    const next = { date: current.date, count: current.count + 1 };
    storage.setItem(DAILY_COUNT_KEY, JSON.stringify(next));
}
//# sourceMappingURL=storage.js.map