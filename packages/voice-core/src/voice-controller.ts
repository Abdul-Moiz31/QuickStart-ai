import { GeminiLiveClient } from "./gemini-live-client.js";
import { PcmPlayer } from "./pcm-player.js";
import { PcmRecorder } from "./pcm-recorder.js";
import type {
  VoiceApiClient,
  VoiceConnectionState,
  VoiceControllerCallbacks,
  VoiceTranscriptEvent,
} from "./types.js";

const HEARTBEAT_MS = 25_000;

/** Orchestrates mic capture, Gemini Live, playback, and session lifecycle. */
export class VoiceSessionController {
  private recorder = new PcmRecorder();
  private player = new PcmPlayer();
  private gemini: GeminiLiveClient | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private voiceSessionId: string | null = null;
  private resumptionHandle: string | undefined;
  private state: VoiceConnectionState = "idle";
  private destroyed = false;
  private stopping = false;

  constructor(
    private api: VoiceApiClient,
    private callbacks: VoiceControllerCallbacks = {},
  ) {}

  get connectionState(): VoiceConnectionState {
    return this.state;
  }

  get isActive(): boolean {
    return this.state === "live" || this.state === "speaking" || this.state === "connecting";
  }

  get activeVoiceSessionId(): string | null {
    return this.voiceSessionId;
  }

  getMicLevels(): number[] | null {
    return this.recorder.getMicLevels();
  }

  async start(chatSessionId?: string): Promise<void> {
    if (this.isActive) return;
    this.destroyed = false;
    this.stopping = false;
    this.setState("connecting");

    try {
      const session = await this.api.createVoiceSession(chatSessionId, this.resumptionHandle);
      this.voiceSessionId = session.voiceSessionId;

      this.gemini = new GeminiLiveClient({
        ephemeralToken: session.ephemeralToken,
        model: session.model,
        onAudio: (pcm) => {
          void this.player.playBase64Pcm(pcm);
        },
        onTranscript: (event) => this.emitTranscript(event),
        onToolCall: (calls) => this.handleToolCalls(calls),
        onResumptionHandle: (handle) => {
          this.resumptionHandle = handle;
          if (this.voiceSessionId) {
            void this.api.voiceHeartbeat(this.voiceSessionId, handle).catch(() => {});
          }
        },
        onInterrupted: () => {
          this.player.interrupt();
        },
        onSpeakingChange: (speaking) => {
          this.setState(speaking ? "speaking" : "live");
        },
        onError: (message) => {
          if (!this.stopping) this.callbacks.onError?.(message);
        },
        onClose: () => {
          if (!this.destroyed && this.state !== "ended") {
            this.setState("reconnecting");
          }
        },
      });

      await this.gemini.connect();
      await this.api.voiceHeartbeat(session.voiceSessionId, this.resumptionHandle);
      await this.recorder.start((chunk) => this.gemini?.sendAudio(chunk));
      this.startHeartbeat();
      this.setState("live");
    } catch (err) {
      this.setState("error");
      const message = err instanceof Error ? err.message : "Could not start voice session";
      this.callbacks.onError?.(message);
      await this.cleanup("error");
      throw err;
    }
  }

  async stop(reason: "user" | "error" | "timeout" = "user"): Promise<void> {
    if (this.stopping && this.state === "ended") return;
    this.stopping = true;
    this.destroyed = true;
    await this.cleanup(reason);
    this.setState("ended");
  }

  private async cleanup(reason: "user" | "error" | "timeout"): Promise<void> {
    this.stopHeartbeat();
    this.recorder.stop();
    this.player.destroy();
    this.gemini?.close();
    this.gemini = null;

    const id = this.voiceSessionId;
    this.voiceSessionId = null;
    if (id) {
      try {
        await this.api.endVoiceSession(id, reason === "user" ? "user" : reason);
      } catch {
        // Session may already be ended server-side.
      }
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (!this.voiceSessionId || this.stopping) return;
      void this.api
        .voiceHeartbeat(this.voiceSessionId, this.resumptionHandle)
        .catch(() => {
          if (!this.stopping) {
            this.callbacks.onError?.("Voice session heartbeat failed");
          }
        });
    }, HEARTBEAT_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private setState(next: VoiceConnectionState): void {
    if (this.state === next) return;
    this.state = next;
    this.callbacks.onStateChange?.(next);
  }

  private emitTranscript(event: VoiceTranscriptEvent): void {
    this.callbacks.onTranscript?.(event);
  }

  private async handleToolCalls(
    calls: Array<{ id?: string; name?: string; args?: Record<string, unknown> }>,
  ): Promise<void> {
    if (!this.voiceSessionId || this.stopping) return;
    for (const call of calls) {
      const id = call.id ?? "";
      const name = call.name ?? "";
      if (!id || !name) continue;
      try {
        const result = await this.api.executeVoiceTool(this.voiceSessionId, {
          id,
          name,
          args: (call.args ?? {}) as Record<string, unknown>,
        });
        if (!this.stopping) {
          this.gemini?.sendToolResponse(id, name, result.output);
        }
        if (result.actions?.humanPending) {
          this.callbacks.onEscalation?.();
        }
        if (result.actions?.stopVoice) {
          void this.stop("user");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Tool execution failed";
        if (!this.stopping) {
          this.gemini?.sendToolResponse(id, name, { error: message });
        }
      }
    }
  }
}
