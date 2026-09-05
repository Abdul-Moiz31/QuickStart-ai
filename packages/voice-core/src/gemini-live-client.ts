import { GoogleGenAI, type FunctionCall, type LiveServerMessage, type Session } from "@google/genai/web";
import type { VoiceTranscriptEvent } from "./types.js";

export interface GeminiLiveClientOptions {
  ephemeralToken: string;
  model: string;
  onAudio: (base64Pcm: string) => void;
  onTranscript: (event: VoiceTranscriptEvent) => void;
  onToolCall: (calls: FunctionCall[]) => void | Promise<void>;
  onResumptionHandle: (handle: string) => void;
  onInterrupted: () => void;
  onSpeakingChange?: (speaking: boolean) => void;
  onError: (message: string) => void;
  onClose: () => void;
}

const SETUP_TIMEOUT_MS = 12_000;

/** Thin wrapper around @google/genai live.connect for browser voice sessions. */
export class GeminiLiveClient {
  private session: Session | null = null;
  private speaking = false;

  constructor(private opts: GeminiLiveClientOptions) {}

  get connected(): boolean {
    return this.session !== null;
  }

  async connect(): Promise<void> {
    const ai = new GoogleGenAI({
      apiKey: this.opts.ephemeralToken,
      apiVersion: "v1alpha",
    });

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      let setupTimer: ReturnType<typeof setTimeout> | null = null;

      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        if (setupTimer) clearTimeout(setupTimer);
        fn();
      };

      ai.live
        .connect({
          model: this.opts.model,
          callbacks: {
            onopen: () => {},
            onmessage: (msg) => {
              this.handleMessage(msg);
              if (msg.setupComplete) {
                finish(resolve);
              }
            },
            onerror: (e) => {
              const message = e.message || "Live voice connection error";
              this.opts.onError(message);
              finish(() => reject(new Error(message)));
            },
            onclose: (e) => {
              this.setSpeaking(false);
              this.opts.onClose();
              const reason = e.reason?.trim();
              if (!settled) {
                finish(() =>
                  reject(
                    new Error(
                      reason ||
                        `Live connection closed (${e.code}). Check GEMINI_LIVE_MODEL supports Live API.`,
                    ),
                  ),
                );
              }
            },
          },
        })
        .then((session) => {
          this.session = session;
          setupTimer = setTimeout(() => {
            finish(() => reject(new Error("Live voice setup timed out")));
          }, SETUP_TIMEOUT_MS);
        })
        .catch((err) => {
          finish(() =>
            reject(err instanceof Error ? err : new Error(String(err))),
          );
        });
    });
  }

  sendAudio(base64Pcm: string): void {
    this.session?.sendRealtimeInput({
      audio: { data: base64Pcm, mimeType: "audio/pcm;rate=16000" },
    });
  }

  sendToolResponse(id: string, name: string, output: unknown): void {
    this.session?.sendToolResponse({
      functionResponses: {
        id,
        name,
        response: { output },
      },
    });
  }

  close(): void {
    this.session?.close();
    this.session = null;
    this.setSpeaking(false);
  }

  private setSpeaking(next: boolean): void {
    if (this.speaking === next) return;
    this.speaking = next;
    this.opts.onSpeakingChange?.(next);
  }

  private handleMessage(msg: LiveServerMessage): void {
    if (msg.sessionResumptionUpdate?.newHandle) {
      this.opts.onResumptionHandle(msg.sessionResumptionUpdate.newHandle);
    }

    const content = msg.serverContent;
    if (content?.interrupted) {
      this.setSpeaking(false);
      this.opts.onInterrupted();
    }

    if (content?.inputTranscription?.text) {
      this.opts.onTranscript({
        role: "user",
        text: content.inputTranscription.text,
        final: Boolean(content.inputTranscription.finished),
      });
    }

    if (content?.outputTranscription?.text) {
      this.opts.onTranscript({
        role: "assistant",
        text: content.outputTranscription.text,
        final: Boolean(content.outputTranscription.finished),
      });
    }

    const parts = content?.modelTurn?.parts ?? [];
    let sawAudio = false;
    for (const part of parts) {
      const mime = part.inlineData?.mimeType ?? "";
      if (part.inlineData?.data && mime.includes("audio")) {
        sawAudio = true;
        this.opts.onAudio(part.inlineData.data);
      }
      // Spoken words come from outputTranscription only — modelTurn text parts are
      // internal reasoning/thought summaries and must not appear in the chat UI.
    }
    if (sawAudio) {
      this.setSpeaking(true);
    }
    if (content?.turnComplete || content?.generationComplete) {
      this.setSpeaking(false);
      if (content.outputTranscription?.text) {
        this.opts.onTranscript({
          role: "assistant",
          text: content.outputTranscription.text,
          final: true,
        });
      }
      if (content.inputTranscription?.text) {
        this.opts.onTranscript({
          role: "user",
          text: content.inputTranscription.text,
          final: true,
        });
      }
    }

    const calls = msg.toolCall?.functionCalls;
    if (calls?.length) {
      void this.opts.onToolCall(calls);
    }
  }
}
