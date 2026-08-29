import { describe, expect, it } from "vitest";
import { checkVoiceGate } from "./voice-gate.js";

describe("checkVoiceGate", () => {
  it("blocks the free plan regardless of usage", () => {
    const result = checkVoiceGate("free", 0);
    expect(result.allowed).toBe(false);
    expect(result.allowed === false && result.code).toBe("PLAN_UPGRADE_REQUIRED");
  });

  it("allows a pro project under its daily cap", () => {
    const result = checkVoiceGate("pro", 5);
    expect(result.allowed).toBe(true);
  });

  it("blocks a pro project once its daily cap is reached", () => {
    const result = checkVoiceGate("pro", 200);
    expect(result.allowed).toBe(false);
    expect(result.allowed === false && result.code).toBe("PLAN_LIMIT_EXCEEDED");
  });

  it("allows enterprise well past pro's cap", () => {
    const result = checkVoiceGate("enterprise", 500);
    expect(result.allowed).toBe(true);
  });
});
