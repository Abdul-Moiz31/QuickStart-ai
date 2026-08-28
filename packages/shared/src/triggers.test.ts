import { describe, expect, it } from "vitest";
import {
  proactiveTriggerRuleSchema,
  proactiveTriggersConfigSchema,
  triggerConditionSchema,
} from "./schemas.js";

describe("triggerConditionSchema", () => {
  it("accepts a valid time_on_page condition", () => {
    const result = triggerConditionSchema.safeParse({ type: "time_on_page", seconds: 20 });
    expect(result.success).toBe(true);
  });

  it("accepts exit_intent with no extra fields", () => {
    const result = triggerConditionSchema.safeParse({ type: "exit_intent" });
    expect(result.success).toBe(true);
  });

  it("rejects time_on_page with a non-positive duration", () => {
    const result = triggerConditionSchema.safeParse({ type: "time_on_page", seconds: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects scroll_depth above 100 percent", () => {
    const result = triggerConditionSchema.safeParse({ type: "scroll_depth", percent: 150 });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown condition type", () => {
    const result = triggerConditionSchema.safeParse({ type: "mind_reading" });
    expect(result.success).toBe(false);
  });

  it("rejects url_match with an empty pattern", () => {
    const result = triggerConditionSchema.safeParse({ type: "url_match", pattern: "" });
    expect(result.success).toBe(false);
  });
});

describe("proactiveTriggerRuleSchema", () => {
  it("accepts a rule combining multiple conditions (AND)", () => {
    const result = proactiveTriggerRuleSchema.safeParse({
      id: "pricing-nudge",
      message: "Questions about pricing?",
      conditions: [
        { type: "url_match", pattern: "/pricing" },
        { type: "time_on_page", seconds: 15 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("defaults enabled to true when omitted", () => {
    const result = proactiveTriggerRuleSchema.parse({
      id: "r1",
      message: "Hi",
      conditions: [{ type: "idle", seconds: 10 }],
    });
    expect(result.enabled).toBe(true);
  });

  it("rejects a rule with zero conditions", () => {
    const result = proactiveTriggerRuleSchema.safeParse({
      id: "r1",
      message: "Hi",
      conditions: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a rule with an empty message", () => {
    const result = proactiveTriggerRuleSchema.safeParse({
      id: "r1",
      message: "",
      conditions: [{ type: "exit_intent" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("proactiveTriggersConfigSchema", () => {
  it("defaults maxFiresPerDay to 3", () => {
    const result = proactiveTriggersConfigSchema.parse({ rules: [] });
    expect(result.maxFiresPerDay).toBe(3);
  });

  it("rejects more than 20 rules", () => {
    const rules = Array.from({ length: 21 }, (_, i) => ({
      id: `r${i}`,
      message: "Hi",
      conditions: [{ type: "idle" as const, seconds: 10 }],
    }));
    const result = proactiveTriggersConfigSchema.safeParse({ rules });
    expect(result.success).toBe(false);
  });

  it("rejects maxFiresPerDay of 0", () => {
    const result = proactiveTriggersConfigSchema.safeParse({ maxFiresPerDay: 0, rules: [] });
    expect(result.success).toBe(false);
  });
});
