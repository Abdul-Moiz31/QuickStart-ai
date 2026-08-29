import { env } from "./env.js";

const GROQ_TRANSCRIPTION_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const MODEL = "whisper-large-v3-turbo";

export class VoiceTranscriptionError extends Error {}

/** Transcribes a short audio clip via Groq's hosted Whisper endpoint. */
export async function transcribeAudio(buffer: Buffer, mimeType: string): Promise<string> {
  if (!env.groqApiKey) {
    throw new VoiceTranscriptionError("Voice transcription is not configured on this server.");
  }

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mimeType }), "clip.webm");
  form.append("model", MODEL);
  form.append("response_format", "json");

  const res = await fetch(GROQ_TRANSCRIPTION_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.groqApiKey}` },
    body: form,
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new VoiceTranscriptionError(`Groq transcription failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").trim();
}
