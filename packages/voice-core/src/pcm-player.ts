import { int16ToFloat32, OUTPUT_RATE } from "./audio-utils.js";

/** Plays 24 kHz PCM16 chunks with interrupt support. */
export class PcmPlayer {
  private context: AudioContext | null = null;
  private nextStartTime = 0;
  private scheduled: AudioBufferSourceNode[] = [];

  async ensureContext(): Promise<AudioContext> {
    if (!this.context) {
      this.context = new AudioContext({ sampleRate: OUTPUT_RATE });
    }
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
    return this.context;
  }

  async playBase64Pcm(base64: string): Promise<void> {
    const ctx = await this.ensureContext();
    const pcm = base64ToInt16Safe(base64);
    if (!pcm.length) return;
    const floats = int16ToFloat32(pcm);
    const buffer = ctx.createBuffer(1, floats.length, OUTPUT_RATE);
    buffer.copyToChannel(new Float32Array(floats), 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    const startAt = Math.max(ctx.currentTime, this.nextStartTime);
    source.start(startAt);
    this.nextStartTime = startAt + buffer.duration;
    this.scheduled.push(source);
    source.onended = () => {
      this.scheduled = this.scheduled.filter((s) => s !== source);
    };
  }

  /** Stop playback immediately when the model is interrupted. */
  interrupt(): void {
    for (const source of this.scheduled) {
      try {
        source.stop();
      } catch {
        // already stopped
      }
    }
    this.scheduled = [];
    if (this.context) {
      this.nextStartTime = this.context.currentTime;
    }
  }

  destroy(): void {
    this.interrupt();
    void this.context?.close();
    this.context = null;
    this.nextStartTime = 0;
  }
}

function base64ToInt16Safe(base64: string): Int16Array {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
  } catch {
    return new Int16Array(0);
  }
}
