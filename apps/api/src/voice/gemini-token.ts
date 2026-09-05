import { GoogleGenAI, type LiveConnectConfig } from "@google/genai/node";
import { env } from "../env.js";
import {
  buildGeminiLiveConnectConfig,
  normalizeGeminiModel,
  type VoiceProjectConfig,
} from "./instructions.js";

export class GeminiTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiTokenError";
  }
}

export interface MintGeminiTokenInput {
  model: string;
  projectVoiceModel?: string | null;
}

export interface MintGeminiTokenResult {
  ephemeralToken: string;
  model: string;
  expiresAt: string;
}

function formatGeminiError(err: unknown): string {
  if (!(err instanceof Error)) return "Gemini token request failed";
  const parts: string[] = [];
  let current: unknown = err;
  while (current instanceof Error) {
    if (current.message && !parts.includes(current.message)) {
      parts.push(current.message);
    }
    current = current.cause;
  }
  return parts.join(" — ") || "Gemini token request failed";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mint a short-lived Gemini Live token constrained to one model + session config.
 * Ephemeral tokens are v1alpha-only — the raw v1beta auth_tokens REST shape differs.
 */
export async function mintGeminiEphemeralToken(
  project: VoiceProjectConfig,
  opts?: { resumptionHandle?: string },
): Promise<MintGeminiTokenResult> {
  if (!env.geminiApiKey) {
    throw new GeminiTokenError("Gemini API key is not configured on this server.");
  }

  const model = normalizeGeminiModel(project.voiceModel || env.geminiLiveModel);
  const liveConfig = buildGeminiLiveConnectConfig(project);

  if (opts?.resumptionHandle) {
    liveConfig.sessionResumption = { handle: opts.resumptionHandle };
  }

  const expireTime = new Date(
    Date.now() + env.voiceEphemeralTokenTtlMin * 60 * 1000,
  ).toISOString();

  const ai = new GoogleGenAI({
    apiKey: env.geminiApiKey,
    apiVersion: "v1alpha",
  });

  const request = {
    config: {
      uses: 1,
      expireTime,
      liveConnectConstraints: {
        model,
        config: liveConfig as LiveConnectConfig,
      },
      httpOptions: { apiVersion: "v1alpha" as const, timeout: 30_000 },
    },
  };

  let token;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      token = await ai.authTokens.create(request);
      lastErr = undefined;
      break;
    } catch (err) {
      lastErr = err;
      if (attempt < 3) await sleep(attempt * 750);
    }
  }

  if (lastErr) {
    throw new GeminiTokenError(formatGeminiError(lastErr));
  }

  if (!token?.name) {
    throw new GeminiTokenError("Gemini token response did not include a token name.");
  }

  return {
    ephemeralToken: token.name,
    model,
    expiresAt: expireTime,
  };
}

/** Health probe — verifies the API key can reach Google's API. */
export async function probeGeminiVoiceHealth(): Promise<{ ok: boolean; message?: string }> {
  if (!env.geminiApiKey) {
    return { ok: false, message: "GEMINI_API_KEY is not configured" };
  }
  if (!env.voiceRealtimeEnabled) {
    return { ok: false, message: "VOICE_REALTIME_ENABLED is false" };
  }
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(env.geminiApiKey)}&pageSize=1`,
      { signal: AbortSignal.timeout(8_000) },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, message: `Gemini API unreachable (${res.status}): ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Gemini health check failed",
    };
  }
}
