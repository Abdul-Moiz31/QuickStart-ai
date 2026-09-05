import { describe, expect, it } from "vitest";
import { isDuplicateVoiceTurn } from "./transcript-persist.js";

describe("isDuplicateVoiceTurn", () => {
  it("skips turns with the same clientTurnId", () => {
    const messages = [
      {
        role: "user" as const,
        content: "Hello",
        meta: { clientTurnId: "42", source: "voice" },
      },
    ];

    expect(
      isDuplicateVoiceTurn(messages, {
        role: "user",
        content: "Hello",
        clientTurnId: "42",
      }),
    ).toBe(true);
  });

  it("skips identical role and content in recent history", () => {
    const messages = [{ role: "assistant" as const, content: "Sure thing", meta: {} }];

    expect(
      isDuplicateVoiceTurn(messages, {
        role: "assistant",
        content: "Sure thing",
      }),
    ).toBe(true);
  });

  it("allows a new turn with different content", () => {
    const messages = [{ role: "user" as const, content: "Hello", meta: {} }];

    expect(
      isDuplicateVoiceTurn(messages, {
        role: "user",
        content: "Goodbye",
      }),
    ).toBe(false);
  });
});
