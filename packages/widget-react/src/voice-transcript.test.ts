import { describe, expect, it } from "vitest";
import { applyVoiceTranscript, mergeTranscriptText } from "./voice-transcript.js";

describe("mergeTranscriptText", () => {
  it("returns cumulative snapshot when incoming extends existing", () => {
    expect(mergeTranscriptText("Hello", "Hello world")).toBe("Hello world");
  });

  it("inserts space between incremental word chunks", () => {
    expect(mergeTranscriptText("Hello how can I", "assist you")).toBe("Hello how can I assist you");
  });

  it("merges overlapping suffix/prefix without duplication", () => {
    expect(mergeTranscriptText("Hello how can", "can I help")).toBe("Hello how can I help");
  });

  it("keeps longer prev when incoming is shorter prefix", () => {
    expect(mergeTranscriptText("Hello world", "Hello")).toBe("Hello world");
  });

  it("joins disjoint fragments with a space", () => {
    expect(mergeTranscriptText("QuickStart AI", "helps businesses")).toBe("QuickStart AI helps businesses");
  });
});

describe("applyVoiceTranscript", () => {
  it("creates separate user bubbles across finalized turns", () => {
    let messages: Parameters<typeof applyVoiceTranscript>[0] = [];
    let turn = { userIdx: null, assistantIdx: null };

    ({ messages, turn } = applyVoiceTranscript(messages, { role: "user", text: "Hi", final: true }, turn));
    ({ messages, turn } = applyVoiceTranscript(
      messages,
      { role: "assistant", text: "Hello!", final: true },
      turn,
    ));
    ({ messages, turn } = applyVoiceTranscript(
      messages,
      { role: "user", text: "Tell me more", final: true },
      turn,
    ));

    expect(messages.filter((m) => m.role === "user")).toHaveLength(2);
    expect(messages[2]?.content).toBe("Tell me more");
  });

  it("finalizes user bubble when assistant starts speaking", () => {
    let messages: Parameters<typeof applyVoiceTranscript>[0] = [];
    let turn = { userIdx: null, assistantIdx: null };

    ({ messages, turn } = applyVoiceTranscript(
      messages,
      { role: "user", text: "Question", final: false },
      turn,
    ));
    ({ messages, turn } = applyVoiceTranscript(
      messages,
      { role: "assistant", text: "Answer", final: false },
      turn,
    ));

    expect(messages[0]?.streaming).toBe(false);
    expect(turn.userIdx).toBeNull();
  });
});
