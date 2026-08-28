import { describe, expect, it } from "vitest";
import { evaluateCondition, evaluateRule, matchesUrlPattern } from "./evaluate.js";
import type { ProactiveTriggerRule, TriggerState } from "./types.js";

function state(overrides: Partial<TriggerState> = {}): TriggerState {
  return {
    elapsedSeconds: 0,
    idleSeconds: 0,
    pathname: "/",
    scrollPercent: 0,
    exitIntent: false,
    ...overrides,
  };
}

describe("matchesUrlPattern", () => {
  it("matches an exact path", () => {
    expect(matchesUrlPattern("/pricing", "/pricing")).toBe(true);
  });

  it("matches a nested path under the pattern", () => {
    expect(matchesUrlPattern("/pricing/enterprise", "/pricing")).toBe(true);
  });

  it("does not match a sibling path with a shared prefix", () => {
    expect(matchesUrlPattern("/pricing-faq", "/pricing")).toBe(false);
  });

  it("supports wildcard patterns", () => {
    expect(matchesUrlPattern("/blog/post-1", "/blog/*")).toBe(true);
    expect(matchesUrlPattern("/blog", "/blog/*")).toBe(false);
  });
});

describe("evaluateCondition", () => {
  it("time_on_page is true once elapsed seconds reach the threshold", () => {
    const condition = { type: "time_on_page" as const, seconds: 20 };
    expect(evaluateCondition(condition, state({ elapsedSeconds: 19 }))).toBe(false);
    expect(evaluateCondition(condition, state({ elapsedSeconds: 20 }))).toBe(true);
  });

  it("idle is true once idle seconds reach the threshold", () => {
    const condition = { type: "idle" as const, seconds: 10 };
    expect(evaluateCondition(condition, state({ idleSeconds: 5 }))).toBe(false);
    expect(evaluateCondition(condition, state({ idleSeconds: 10 }))).toBe(true);
  });

  it("url_match delegates to matchesUrlPattern", () => {
    const condition = { type: "url_match" as const, pattern: "/checkout" };
    expect(evaluateCondition(condition, state({ pathname: "/checkout" }))).toBe(true);
    expect(evaluateCondition(condition, state({ pathname: "/cart" }))).toBe(false);
  });

  it("scroll_depth is true once scroll percent reaches the threshold", () => {
    const condition = { type: "scroll_depth" as const, percent: 50 };
    expect(evaluateCondition(condition, state({ scrollPercent: 49 }))).toBe(false);
    expect(evaluateCondition(condition, state({ scrollPercent: 50 }))).toBe(true);
  });

  it("exit_intent reflects the state flag directly", () => {
    const condition = { type: "exit_intent" as const };
    expect(evaluateCondition(condition, state({ exitIntent: false }))).toBe(false);
    expect(evaluateCondition(condition, state({ exitIntent: true }))).toBe(true);
  });
});

describe("evaluateRule", () => {
  const baseRule: ProactiveTriggerRule = {
    id: "r1",
    message: "Hi",
    conditions: [
      { type: "url_match", pattern: "/pricing" },
      { type: "time_on_page", seconds: 15 },
    ],
  };

  it("requires every condition to hold (AND)", () => {
    expect(
      evaluateRule(baseRule, state({ pathname: "/pricing", elapsedSeconds: 15 })),
    ).toBe(true);
    expect(
      evaluateRule(baseRule, state({ pathname: "/pricing", elapsedSeconds: 5 })),
    ).toBe(false);
    expect(
      evaluateRule(baseRule, state({ pathname: "/other", elapsedSeconds: 30 })),
    ).toBe(false);
  });

  it("never fires a disabled rule", () => {
    const disabled = { ...baseRule, enabled: false };
    expect(
      evaluateRule(disabled, state({ pathname: "/pricing", elapsedSeconds: 30 })),
    ).toBe(false);
  });
});
