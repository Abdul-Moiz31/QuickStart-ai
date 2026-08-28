import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TriggerEngine } from "./engine.js";
import type { ProactiveTriggerRule, ProactiveTriggersConfig } from "./types.js";

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

function rule(overrides: Partial<ProactiveTriggerRule> & Pick<ProactiveTriggerRule, "conditions">): ProactiveTriggerRule {
  return { id: overrides.id ?? "r1", message: overrides.message ?? "Hi", ...overrides };
}

let engine: TriggerEngine | null = null;

beforeEach(() => {
  vi.useFakeTimers();
  window.history.pushState({}, "", "/");
  Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
});

afterEach(() => {
  engine?.stop();
  engine = null;
  vi.useRealTimers();
});

function start(config: ProactiveTriggersConfig, onFire: (rule: ProactiveTriggerRule) => void) {
  engine = new TriggerEngine(config, {
    onFire,
    sessionStorage: memoryStorage(),
    localStorage: memoryStorage(),
  });
  engine.start();
  return engine;
}

describe("TriggerEngine — time_on_page", () => {
  it("fires once the configured time has elapsed", () => {
    const onFire = vi.fn();
    start({ rules: [rule({ id: "t1", conditions: [{ type: "time_on_page", seconds: 5 }] })] }, onFire);

    vi.advanceTimersByTime(4000);
    expect(onFire).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1500);
    expect(onFire).toHaveBeenCalledTimes(1);
    expect(onFire.mock.calls[0]![0].id).toBe("t1");
  });

  it("fires at most once even if the timer keeps running", () => {
    const onFire = vi.fn();
    start({ rules: [rule({ id: "t1", conditions: [{ type: "time_on_page", seconds: 2 }] })] }, onFire);
    vi.advanceTimersByTime(10_000);
    expect(onFire).toHaveBeenCalledTimes(1);
  });
});

describe("TriggerEngine — url_match", () => {
  it("fires only on a matching pathname", () => {
    const onFire = vi.fn();
    window.history.pushState({}, "", "/other");
    start({ rules: [rule({ id: "u1", conditions: [{ type: "url_match", pattern: "/pricing" }] })] }, onFire);
    vi.advanceTimersByTime(1000);
    expect(onFire).not.toHaveBeenCalled();
  });

  it("fires when the pathname matches", () => {
    const onFire = vi.fn();
    window.history.pushState({}, "", "/pricing");
    start({ rules: [rule({ id: "u1", conditions: [{ type: "url_match", pattern: "/pricing" }] })] }, onFire);
    vi.advanceTimersByTime(1000);
    expect(onFire).toHaveBeenCalledTimes(1);
  });
});

describe("TriggerEngine — combined conditions (AND)", () => {
  it("requires both conditions before firing", () => {
    const onFire = vi.fn();
    window.history.pushState({}, "", "/other");
    start(
      {
        rules: [
          rule({
            id: "combo",
            conditions: [
              { type: "url_match", pattern: "/pricing" },
              { type: "time_on_page", seconds: 5 },
            ],
          }),
        ],
      },
      onFire,
    );
    vi.advanceTimersByTime(6000);
    expect(onFire).not.toHaveBeenCalled();
  });
});

describe("TriggerEngine — idle", () => {
  it("fires after inactivity but not while activity keeps resetting it", () => {
    const onFire = vi.fn();
    start({ rules: [rule({ id: "i1", conditions: [{ type: "idle", seconds: 3 }] })] }, onFire);

    vi.advanceTimersByTime(2000);
    window.dispatchEvent(new Event("mousemove"));
    vi.advanceTimersByTime(2000);
    expect(onFire).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1500);
    expect(onFire).toHaveBeenCalledTimes(1);
  });
});

describe("TriggerEngine — exit_intent", () => {
  it("fires when the mouse leaves toward the top of the viewport", () => {
    const onFire = vi.fn();
    start({ rules: [rule({ id: "e1", conditions: [{ type: "exit_intent" }] })] }, onFire);

    document.dispatchEvent(new MouseEvent("mouseout", { clientY: 0, relatedTarget: null }));
    vi.advanceTimersByTime(600);
    expect(onFire).toHaveBeenCalledTimes(1);
  });

  it("does not fire on an unrelated mouseout", () => {
    const onFire = vi.fn();
    start({ rules: [rule({ id: "e1", conditions: [{ type: "exit_intent" }] })] }, onFire);

    document.dispatchEvent(new MouseEvent("mouseout", { clientY: 300, relatedTarget: document.body }));
    vi.advanceTimersByTime(600);
    expect(onFire).not.toHaveBeenCalled();
  });
});

describe("TriggerEngine — session dedupe", () => {
  it("never fires the same rule twice in one session, even across restart", () => {
    const onFire = vi.fn();
    const session = memoryStorage();
    const config: ProactiveTriggersConfig = {
      rules: [rule({ id: "t1", conditions: [{ type: "time_on_page", seconds: 1 }] })],
    };

    engine = new TriggerEngine(config, { onFire, sessionStorage: session, localStorage: memoryStorage() });
    engine.start();
    vi.advanceTimersByTime(2000);
    expect(onFire).toHaveBeenCalledTimes(1);
    engine.stop();

    engine = new TriggerEngine(config, { onFire, sessionStorage: session, localStorage: memoryStorage() });
    engine.start();
    vi.advanceTimersByTime(2000);
    expect(onFire).toHaveBeenCalledTimes(1);
  });
});

describe("TriggerEngine — daily frequency cap", () => {
  it("stops firing further rules once the daily cap is reached", () => {
    const onFire = vi.fn();
    const local = memoryStorage();
    const config: ProactiveTriggersConfig = {
      maxFiresPerDay: 1,
      rules: [
        rule({ id: "a", conditions: [{ type: "time_on_page", seconds: 1 }] }),
        rule({ id: "b", conditions: [{ type: "time_on_page", seconds: 1 }] }),
      ],
    };
    engine = new TriggerEngine(config, { onFire, sessionStorage: memoryStorage(), localStorage: local });
    engine.start();
    vi.advanceTimersByTime(2000);
    expect(onFire).toHaveBeenCalledTimes(1);
  });
});

describe("TriggerEngine — disabled rule", () => {
  it("never fires", () => {
    const onFire = vi.fn();
    start(
      {
        rules: [rule({ id: "d1", enabled: false, conditions: [{ type: "time_on_page", seconds: 1 }] })],
      },
      onFire,
    );
    vi.advanceTimersByTime(3000);
    expect(onFire).not.toHaveBeenCalled();
  });
});
