import { describe, expect, it } from "vitest";
import { TranscriptTurnBuffer } from "./transcript-buffer.js";
import type { VoiceTranscriptEvent } from "./types.js";

describe("TranscriptTurnBuffer", () => {
  it("accumulates partial user chunks and emits full text on finish", () => {
    const buffer = new TranscriptTurnBuffer();
    const events: VoiceTranscriptEvent[] = [];

    buffer.ingest("user", "Hello", false, (event) => events.push(event));
    buffer.ingest("user", "Hello world", true, (event) => events.push(event));

    const finals = events.filter((event) => event.final);
    expect(finals).toHaveLength(1);
    expect(finals[0]?.text).toBe("Hello world");
  });

  it("finalizes assistant turn on turnComplete", () => {
    const buffer = new TranscriptTurnBuffer();
    const events: VoiceTranscriptEvent[] = [];

    buffer.ingest("assistant", "Sure", false, (event) => events.push(event));
    buffer.ingest("assistant", "Sure thing", false, (event) => events.push(event));
    buffer.finalizeAll((event) => events.push(event));

    const finals = events.filter((event) => event.final);
    expect(finals.at(-1)).toEqual({ role: "assistant", text: "Sure thing", final: true });
  });

  it("finalizes previous role when speaker switches", () => {
    const buffer = new TranscriptTurnBuffer();
    const events: VoiceTranscriptEvent[] = [];
    const emit = (event: VoiceTranscriptEvent) => events.push(event);

    buffer.ingest("user", "Need help", false, emit);
    buffer.ingest("assistant", "Of course", false, emit);

    const userFinal = events.find((event) => event.role === "user" && event.final);
    expect(userFinal?.text).toBe("Need help");
  });
});
