import { mergeTranscriptText } from "./transcript-merge.js";
import type { VoiceTranscriptEvent } from "./types.js";

/** Accumulates partial Gemini Live transcriptions into full turns. */
export class TranscriptTurnBuffer {
  private userBuffer = "";
  private assistantBuffer = "";
  private activeRole: "user" | "assistant" | null = null;

  reset(): void {
    this.userBuffer = "";
    this.assistantBuffer = "";
    this.activeRole = null;
  }

  private bufferFor(role: "user" | "assistant"): string {
    return role === "user" ? this.userBuffer : this.assistantBuffer;
  }

  private setBuffer(role: "user" | "assistant", value: string): void {
    if (role === "user") this.userBuffer = value;
    else this.assistantBuffer = value;
  }

  private emitFinal(role: "user" | "assistant", emit: (event: VoiceTranscriptEvent) => void): void {
    const text = this.bufferFor(role).trim();
    if (!text) return;
    emit({ role, text, final: true });
    this.setBuffer(role, "");
    if (this.activeRole === role) this.activeRole = null;
  }

  ingest(
    role: "user" | "assistant",
    chunk: string,
    finished: boolean,
    emit: (event: VoiceTranscriptEvent) => void,
  ): void {
    const incoming = chunk.trim();
    if (!incoming) return;

    if (this.activeRole && this.activeRole !== role) {
      this.emitFinal(this.activeRole, emit);
    }

    this.activeRole = role;
    const merged = mergeTranscriptText(this.bufferFor(role), incoming);
    this.setBuffer(role, merged);
    emit({ role, text: merged, final: false });

    if (finished) {
      this.emitFinal(role, emit);
    }
  }

  finalizeAll(emit: (event: VoiceTranscriptEvent) => void): void {
    this.emitFinal("assistant", emit);
    this.emitFinal("user", emit);
  }
}
