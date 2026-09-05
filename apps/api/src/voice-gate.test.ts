import { describe, expect, it } from "vitest";
import {
  checkVoiceRealtimeGate,
  checkVoiceTranscribeGate,
} from "./voice-gate.js";

describe("checkVoiceTranscribeGate", () => {
  it("blocks the free plan regardless of usage", () => {
    const result = checkVoiceTranscribeGate("free", 0);
    expect(result.allowed).toBe(false);
    expect(result.allowed === false && result.code).toBe("PLAN_UPGRADE_REQUIRED");
  });

  it("allows a pro project under its daily cap", () => {
    const result = checkVoiceTranscribeGate("pro", 5);
    expect(result.allowed).toBe(true);
  });

  it("blocks a pro project once its daily cap is reached", () => {
    const result = checkVoiceTranscribeGate("pro", 200);
    expect(result.allowed).toBe(false);
    expect(result.allowed === false && result.code).toBe("PLAN_LIMIT_EXCEEDED");
  });

  it("allows enterprise well past pro's cap", () => {
    const result = checkVoiceTranscribeGate("enterprise", 500);
    expect(result.allowed).toBe(true);
  });
});

describe("checkVoiceRealtimeGate", () => {
  it("blocks when voice is disabled on the project", () => {
    const result = checkVoiceRealtimeGate("pro", 0, 0, false);
    expect(result.allowed).toBe(false);
    expect(result.allowed === false && result.code).toBe("VOICE_DISABLED");
  });

  it("blocks free plan even when voice is enabled", () => {
    const result = checkVoiceRealtimeGate("free", 0, 0, true);
    expect(result.allowed).toBe(false);
    expect(result.allowed === false && result.code).toBe("PLAN_UPGRADE_REQUIRED");
  });

  it("allows pro under monthly and concurrent limits", () => {
    const result = checkVoiceRealtimeGate("pro", 10, 1, true);
    expect(result.allowed).toBe(true);
  });

  it("blocks when concurrent sessions are at cap", () => {
    const result = checkVoiceRealtimeGate("pro", 0, 5, true);
    expect(result.allowed).toBe(false);
    expect(result.allowed === false && result.code).toBe("CONCURRENT_LIMIT");
  });
});
