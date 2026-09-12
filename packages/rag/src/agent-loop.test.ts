import { describe, expect, it } from "vitest";
import { parseAgentStep, AGENT_MAX_ITERATIONS, AGENT_MAX_TOOL_CALLS } from "./agent-loop.js";

describe("parseAgentStep", () => {
  it("parses speak step", () => {
    expect(
      parseAgentStep('Sure — {"step":"speak","text":"One moment while I check."}'),
    ).toEqual({ step: "speak", text: "One moment while I check." });
  });

  it("parses tool step with args", () => {
    expect(
      parseAgentStep(
        '{"step":"tool","name":"search_knowledge","args":{"query":"refund policy"}}',
      ),
    ).toEqual({
      step: "tool",
      name: "search_knowledge",
      args: { query: "refund policy" },
    });
  });

  it("parses answer step", () => {
    expect(parseAgentStep('{"step":"answer","text":"Here is the refund policy."}')).toEqual({
      step: "answer",
      text: "Here is the refund policy.",
    });
  });

  it("returns null for invalid JSON", () => {
    expect(parseAgentStep("not json")).toBeNull();
  });
});

describe("agent limits", () => {
  it("allows multi-step loops", () => {
    expect(AGENT_MAX_ITERATIONS).toBeGreaterThanOrEqual(5);
    expect(AGENT_MAX_TOOL_CALLS).toBeGreaterThanOrEqual(5);
  });
});
