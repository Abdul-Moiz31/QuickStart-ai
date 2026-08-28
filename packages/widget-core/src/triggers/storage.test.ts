import { describe, expect, it } from "vitest";
import {
  hasFiredThisSession,
  isDailyCapExceeded,
  markFiredThisSession,
  recordDailyFire,
} from "./storage.js";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    clear: () => map.clear(),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    get length() {
      return map.size;
    },
  } as Storage;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const T0 = Date.parse("2026-08-28T12:00:00Z");

describe("session dedupe", () => {
  it("a rule that has not fired is not marked as fired", () => {
    expect(hasFiredThisSession(memoryStorage(), "r1")).toBe(false);
  });

  it("marking a rule fired makes it show as fired", () => {
    const storage = memoryStorage();
    markFiredThisSession(storage, "r1");
    expect(hasFiredThisSession(storage, "r1")).toBe(true);
  });

  it("marking one rule does not affect another", () => {
    const storage = memoryStorage();
    markFiredThisSession(storage, "r1");
    expect(hasFiredThisSession(storage, "r2")).toBe(false);
  });
});

describe("daily frequency cap", () => {
  it("is not exceeded before any fires are recorded", () => {
    expect(isDailyCapExceeded(memoryStorage(), 3, T0)).toBe(false);
  });

  it("is exceeded once the count reaches the cap", () => {
    const storage = memoryStorage();
    recordDailyFire(storage, T0);
    recordDailyFire(storage, T0);
    recordDailyFire(storage, T0);
    expect(isDailyCapExceeded(storage, 3, T0)).toBe(true);
  });

  it("is not exceeded just below the cap", () => {
    const storage = memoryStorage();
    recordDailyFire(storage, T0);
    recordDailyFire(storage, T0);
    expect(isDailyCapExceeded(storage, 3, T0)).toBe(false);
  });

  it("resets once the calendar day rolls over", () => {
    const storage = memoryStorage();
    recordDailyFire(storage, T0);
    recordDailyFire(storage, T0);
    recordDailyFire(storage, T0);
    expect(isDailyCapExceeded(storage, 3, T0)).toBe(true);
    expect(isDailyCapExceeded(storage, 3, T0 + DAY_MS)).toBe(false);
  });
});
