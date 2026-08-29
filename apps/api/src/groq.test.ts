import { describe, expect, it } from "vitest";
import { transcribeAudio, VoiceTranscriptionError } from "./groq.js";

describe("transcribeAudio", () => {
  it("refuses to call Groq when no API key is configured", async () => {
    // No GROQ_API_KEY is set in the test environment, matching a server
    // that hasn't had voice mode configured yet.
    await expect(transcribeAudio(Buffer.from("clip"), "audio/webm")).rejects.toThrow(
      VoiceTranscriptionError,
    );
  });
});
