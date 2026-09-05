import { int16ToBase64, resampleFloatTo16k } from "./audio-utils.js";

/** Captures microphone audio as 16 kHz PCM chunks (~20 ms). */
export class PcmRecorder {
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private onChunk: ((base64: string) => void) | null = null;
  private levelBuffer: Uint8Array<ArrayBuffer> | null = null;

  get active(): boolean {
    return this.stream !== null;
  }

  /** Normalized 0–1 bar levels for UI visualizer. Voice-heavy bins weighted. */
  getMicLevels(barCount = 48): number[] | null {
    if (!this.analyser || !this.levelBuffer) return null;
    this.analyser.getByteFrequencyData(this.levelBuffer);
    const bins = this.levelBuffer.length;
    const lo = Math.floor(bins * 0.04);
    const hi = Math.floor(bins * 0.55);
    const span = Math.max(1, hi - lo);
    const levels: number[] = [];
    for (let i = 0; i < barCount; i += 1) {
      const t = i / (barCount - 1);
      const center = Math.abs(t - 0.5) * 2;
      const binStart = lo + Math.floor(t * span);
      const binEnd = Math.min(hi, binStart + Math.max(1, Math.floor(span / barCount)));
      let peak = 0;
      for (let b = binStart; b < binEnd; b += 1) {
        peak = Math.max(peak, this.levelBuffer[b]! / 255);
      }
      const shaped = peak ** 0.65 * (0.35 + 0.65 * (1 - center ** 1.4));
      levels.push(Math.min(1, shaped * 1.35));
    }
    return levels;
  }

  async start(onChunk: (base64: string) => void): Promise<void> {
    if (this.active) return;
    this.onChunk = onChunk;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    this.context = new AudioContext();
    const inputRate = this.context.sampleRate;
    this.source = this.context.createMediaStreamSource(this.stream);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.82;
    this.analyser.minDecibels = -85;
    this.analyser.maxDecibels = -22;
    this.levelBuffer = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
    // ScriptProcessor: buffer 4096 ≈ ~85 ms at 48 kHz, resampled to 16 kHz
    this.processor = this.context.createScriptProcessor(4096, 1, 1);
    this.processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      const copy = new Float32Array(input.length);
      copy.set(input);
      const pcm = resampleFloatTo16k(copy, inputRate);
      this.onChunk?.(int16ToBase64(pcm));
    };
    this.source.connect(this.analyser);
    this.analyser.connect(this.processor);
    this.processor.connect(this.context.destination);
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  stop(): void {
    this.processor?.disconnect();
    this.analyser?.disconnect();
    this.source?.disconnect();
    this.processor = null;
    this.analyser = null;
    this.source = null;
    this.levelBuffer = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    void this.context?.close();
    this.context = null;
    this.onChunk = null;
  }
}
