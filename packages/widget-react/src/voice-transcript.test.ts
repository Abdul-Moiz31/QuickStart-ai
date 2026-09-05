import { describe, expect, it } from "vitest";
import {
  applyVoiceTranscript,
  collectUnpersistedVoiceTurns,
  mergeTranscriptText,
} from "./voice-transcript.js";

const emptyTurn = { userIdx: null, assistantIdx: null, nextTurnId: 1 };

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
    let turn = { ...emptyTurn };

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
    let turn = { ...emptyTurn };

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

  it("returns finalizedTurn with voiceTurnId when a turn completes", () => {
    const { messages, finalizedTurn } = applyVoiceTranscript(
      [],
      { role: "user", text: "Hello there", final: true },
      { ...emptyTurn },
    );

    expect(finalizedTurn).toEqual({
      turnId: 1,
      role: "user",
      content: "Hello there",
    });
    expect(messages[0]?.voiceTurnId).toBe(1);
  });

  it("returns finalizedTurn on role switch", () => {
    let messages: Parameters<typeof applyVoiceTranscript>[0] = [];
    let turn = { ...emptyTurn };
    let finalizedTurn;

    ({ messages, turn } = applyVoiceTranscript(
      messages,
      { role: "user", text: "Question", final: false },
      turn,
    ));
    ({ messages, turn, finalizedTurn } = applyVoiceTranscript(
      messages,
      { role: "assistant", text: "Answer", final: false },
      turn,
    ));

    expect(finalizedTurn).toEqual({
      turnId: 1,
      role: "user",
      content: "Question",
    });
  });

  it("collects unpersisted voice turns for batch flush", () => {
    const messages = [
      { role: "user" as const, content: "Hi", voiceTurnId: 1 },
      { role: "assistant" as const, content: "Hello", voiceTurnId: 2 },
    ];
    const persisted = new Set<number>([1]);

    expect(collectUnpersistedVoiceTurns(messages, persisted)).toEqual([
      { role: "assistant", content: "Hello", clientTurnId: "2" },
    ]);
  });
});
