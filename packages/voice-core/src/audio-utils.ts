const INPUT_RATE = 16_000;
const OUTPUT_RATE = 24_000;

export function resampleFloatTo16k(input: Float32Array, inputRate: number): Int16Array {
  if (inputRate === INPUT_RATE) {
    return floatToInt16(input);
  }
  const ratio = inputRate / INPUT_RATE;
  const outLen = Math.max(1, Math.floor(input.length / ratio));
  const out = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const srcIdx = i * ratio;
    const idx = Math.floor(srcIdx);
    const frac = srcIdx - idx;
    const a = input[idx] ?? 0;
    const b = input[idx + 1] ?? a;
    const sample = a * (1 - frac) + b * frac;
    out[i] = floatSampleToInt16(sample);
  }
  return out;
}

export function floatToInt16(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    out[i] = floatSampleToInt16(input[i] ?? 0);
  }
  return out;
}

function floatSampleToInt16(sample: number): number {
  const s = Math.max(-1, Math.min(1, sample));
  return s < 0 ? s * 0x8000 : s * 0x7fff;
}

export function int16ToBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function base64ToInt16(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
}

export function int16ToFloat32(pcm: Int16Array): Float32Array {
  const out = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) {
    out[i] = (pcm[i] ?? 0) / 0x8000;
  }
  return out;
}

export { INPUT_RATE, OUTPUT_RATE };
