import { EMBEDDING_DIMENSIONS } from "@quickstart-ai/shared";

export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
}

export interface EmbeddingsClient {
  embed(texts: string[]): Promise<number[][]>;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  /** Rotate fallback chain start (e.g. eval case index) to spread load across free models. */
  modelChainRotate?: number;
  /** Disable tool calls for auxiliary text-only tasks (HyDE, rerank, planner). */
  textOnly?: boolean;
}

export interface ChatClient {
  chat(messages: LLMMessage[], options?: ChatOptions): Promise<string>;
  chatStream?(messages: LLMMessage[], options?: ChatOptions): AsyncGenerator<string>;
}

const TEXT_ONLY_HINT = "Reply with plain text only. Do not call tools.";

function withTextOnlyHint(messages: LLMMessage[]): LLMMessage[] {
  const systemIdx = messages.findIndex((m) => m.role === "system");
  if (systemIdx >= 0) {
    return messages.map((m, i) =>
      i === systemIdx ? { ...m, content: `${m.content}\n\n${TEXT_ONLY_HINT}` } : m,
    );
  }
  return [{ role: "system", content: TEXT_ONLY_HINT }, ...messages];
}

function buildChatRequestBody(
  model: string,
  messages: LLMMessage[],
  options: ChatOptions & { stream?: boolean },
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model,
    messages: options.textOnly ? withTextOnlyHint(messages) : messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 800,
    tool_choice: "none",
  };
  if (options.stream) body.stream = true;
  return body;
}

/**
 * Onboarding question generation: try free OpenRouter models first, then cheapest paid.
 * Order: rotate less rate-limited free models before gemma variants.
 */
export const ONBOARDING_FREE_MODELS = [
  "openai/gpt-oss-20b:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "google/gemma-4-26b-a4b-it:free",
] as const;

/** Cheap, solid instruction model when free tier fails / rate-limits. */
export const ONBOARDING_PAID_FALLBACK_MODEL = "mistralai/mistral-nemo";

export const ONBOARDING_MODEL_CHAIN = [
  ...ONBOARDING_FREE_MODELS,
  ONBOARDING_PAID_FALLBACK_MODEL,
] as const;

export interface LlmRuntimeConfig {
  apiKey: string;
  baseUrl: string;
  llmModel: string;
  usingOpenRouter: boolean;
  siteUrl?: string;
  appName?: string;
  embeddingModel?: string;
  dimensions?: number;
}

function getConfig(override?: Partial<LlmRuntimeConfig>) {
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim() || "";
  const openaiKey = process.env.OPENAI_API_KEY?.trim() || "";
  const platformKey = openRouterKey || openaiKey;
  const defaultBase = openRouterKey
    ? "https://openrouter.ai/api/v1"
    : "https://api.openai.com/v1";
  const base = {
    apiKey: platformKey,
    baseUrl: (process.env.OPENAI_BASE_URL ?? defaultBase).replace(/\/$/, ""),
    llmModel:
      process.env.LLM_MODEL ??
      (openRouterKey ? ONBOARDING_FREE_MODELS[0] : "gpt-4o-mini"),
    embeddingModel: process.env.EMBEDDING_MODEL ?? "text-embedding-3-small",
    dimensions: Number(process.env.EMBEDDING_DIMENSIONS ?? EMBEDDING_DIMENSIONS),
    siteUrl: process.env.OPENROUTER_SITE_URL ?? process.env.PUBLIC_API_URL ?? "http://localhost:3000",
    appName: process.env.OPENROUTER_APP_NAME ?? "QuickStart AI",
    usingOpenRouter: Boolean(openRouterKey) || (process.env.OPENAI_BASE_URL ?? "").includes("openrouter"),
  };
  if (!override?.apiKey) return base;
  return {
    ...base,
    ...override,
    baseUrl: (override.baseUrl ?? base.baseUrl).replace(/\/$/, ""),
    usingOpenRouter:
      override.usingOpenRouter ??
      (override.baseUrl?.includes("openrouter") ?? base.usingOpenRouter),
  };
}

function authHeaders(cfg: ReturnType<typeof getConfig>): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${cfg.apiKey}`,
    "Content-Type": "application/json",
  };
  if (cfg.usingOpenRouter) {
    headers["HTTP-Referer"] = cfg.siteUrl;
    headers["X-Title"] = cfg.appName;
  }
  return headers;
}

/** Deterministic local embedding fallback when no API key is set (dev/demo). */
function localEmbed(text: string, dims: number): number[] {
  const vec = new Array<number>(dims).fill(0);
  const tokens = text.toLowerCase().split(/\W+/).filter(Boolean);
  for (const token of tokens) {
    let h = 2166136261;
    for (let i = 0; i < token.length; i++) {
      h ^= token.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const idx = Math.abs(h) % dims;
    vec[idx] = (vec[idx] ?? 0) + 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export function createEmbeddingsClient(runtime?: Partial<LlmRuntimeConfig>): EmbeddingsClient {
  return {
    async embed(texts: string[]) {
      const cfg = getConfig(runtime);
      if (!cfg.apiKey) {
        return texts.map((t) => localEmbed(t, cfg.dimensions));
      }

      // OpenRouter requires provider-prefixed embedding model IDs
      const models = cfg.usingOpenRouter
        ? [
            cfg.embeddingModel.includes("/")
              ? cfg.embeddingModel
              : `openai/${cfg.embeddingModel}`,
            "openai/text-embedding-3-small",
            "qwen/qwen3-embedding-0.6b",
          ]
        : [cfg.embeddingModel];

      const uniqueModels = [...new Set(models)];
      let lastError: Error | null = null;

      for (const model of uniqueModels) {
        try {
          const body: Record<string, unknown> = {
            model,
            input: texts,
          };
          // dimensions only supported by some OpenAI embedding models
          if (model.includes("text-embedding-3")) {
            body.dimensions = cfg.dimensions;
          }

          const res = await fetch(`${cfg.baseUrl}/embeddings`, {
            method: "POST",
            headers: authHeaders(cfg),
            body: JSON.stringify(body),
          });
          if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`Embedding failed (${model}): ${res.status} ${errBody}`);
          }
          const data = (await res.json()) as {
            data: { embedding: number[]; index: number }[];
          };
          const vectors = data.data
            .sort((a, b) => a.index - b.index)
            .map((d) => d.embedding);
          if (vectors.length !== texts.length) {
            throw new Error(`Embedding count mismatch for ${model}`);
          }
          // Pad/truncate to configured dims if needed
          return vectors.map((v) => normalizeDims(v, cfg.dimensions));
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.warn(`[embeddings] ${lastError.message}`);
        }
      }

      console.warn(
        `[embeddings] all remote models failed — using local fallback. Last error: ${lastError?.message ?? "unknown"}`,
      );
      return texts.map((t) => localEmbed(t, cfg.dimensions));
    },
  };
}

function normalizeDims(vec: number[], dims: number): number[] {
  if (vec.length === dims) return vec;
  if (vec.length > dims) return vec.slice(0, dims);
  return [...vec, ...new Array(dims - vec.length).fill(0)];
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRateLimitError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const m = err.message.toLowerCase();
  return m.includes("429") || m.includes("rate-limit") || m.includes("rate_limit");
}

function parseRetryAfterMs(err: Error): number {
  const m = err.message.match(/retry_after_seconds(?:_raw)?":(\d+)/);
  if (m) return Math.min(Number(m[1]) * 1000, 30_000);
  return 2500;
}

async function chatOnce(
  cfg: ReturnType<typeof getConfig>,
  model: string,
  messages: LLMMessage[],
  options: ChatOptions = {},
): Promise<string> {
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: authHeaders(cfg),
    body: JSON.stringify(buildChatRequestBody(model, messages, options)),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Chat failed (${model}): ${res.status} ${body}`);
  }
  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0]?.message?.content?.trim() ?? "";
}

/**
 * Try models in order until one returns usable content.
 * Used for onboarding (5 free → 1 cheap paid) and optional general fallbacks.
 */
export async function chatWithModelFallback(
  messages: LLMMessage[],
  models: readonly string[],
  options: ChatOptions & { runtime?: Partial<LlmRuntimeConfig> } = {},
): Promise<{ content: string; model: string }> {
  const cfg = getConfig(options.runtime);
  if (!cfg.apiKey) {
    const last = [...messages].reverse().find((m) => m.role === "user");
    return {
      content:
        `I'd be happy to help. Based on the available knowledge: ` +
        `${last?.content?.slice(0, 200) ?? "Please provide more details."} ` +
        `(Configure OPENROUTER_API_KEY for full LLM responses.)`,
      model: "local-fallback",
    };
  }

  let chain =
    models.length > 0
      ? [...new Set(models)]
      : getChatModelChain(undefined, options.modelChainRotate ?? 0);
  if (options.modelChainRotate && options.modelChainRotate > 0) {
    const i = options.modelChainRotate % chain.length;
    chain = [...chain.slice(i), ...chain.slice(0, i)];
  }

  let lastError: unknown;
  for (const model of chain) {
    try {
      const content = await chatOnce(cfg, model, messages, options);
      if (content.trim()) return { content, model };
    } catch (err) {
      lastError = err;
      if (isRateLimitError(err)) {
        const wait = parseRetryAfterMs(err as Error);
        console.warn(`[llm] rate limited on ${model}, waiting ${wait}ms then trying next`);
        await sleep(wait);
      } else {
        console.warn(`[llm] model failed, trying next: ${model}`, err);
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("All LLM models in the fallback chain failed");
}

/** Default chat chain: free models first, then cheap paid. */
export const CHAT_MODEL_CHAIN = [
  ...ONBOARDING_FREE_MODELS,
  ONBOARDING_PAID_FALLBACK_MODEL,
] as const;

function getChatModelChain(preferred?: string, rotateIndex = 0, runtime?: Partial<LlmRuntimeConfig>): string[] {
  if (runtime?.apiKey && runtime.llmModel) {
    return [runtime.llmModel];
  }
  const fromEnv = (process.env.LLM_MODEL_FALLBACKS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const cfg = getConfig();
  const head = preferred || cfg.llmModel;
  const base = fromEnv.length > 0 ? fromEnv : [...CHAT_MODEL_CHAIN];
  const deduped = [...new Set([head, ...base, ...CHAT_MODEL_CHAIN, ONBOARDING_PAID_FALLBACK_MODEL].filter(Boolean))];
  if (rotateIndex <= 0 || deduped.length <= 1) return deduped;
  const i = rotateIndex % deduped.length;
  return [...deduped.slice(i), ...deduped.slice(0, i)];
}

export function createChatClient(runtime?: Partial<LlmRuntimeConfig>): ChatClient {
  return {
    async chat(messages, options = {}) {
      const cfg = getConfig(runtime);
      if (!cfg.apiKey) {
        const last = [...messages].reverse().find((m) => m.role === "user");
        return (
          `I'd be happy to help. Based on the available knowledge: ` +
          `${last?.content?.slice(0, 200) ?? "Please provide more details."} ` +
          `(Configure OPENROUTER_API_KEY for full LLM responses.)`
        );
      }
      // Explicit single model override still allowed; otherwise try free→paid chain
      if (options.model) {
        try {
          return await chatOnce(cfg, options.model, messages, options);
        } catch (err) {
          console.warn(`[llm] preferred model failed, falling back: ${options.model}`, err);
        }
      }
      const { content } = await chatWithModelFallback(
        messages,
        getChatModelChain(options.model, options.modelChainRotate ?? 0, runtime),
        { ...options, modelChainRotate: options.modelChainRotate, runtime },
      );
      return content;
    },

    async *chatStream(messages, options = {}) {
      const cfg = getConfig(runtime);
      if (!cfg.apiKey) {
        const text = await this.chat(messages, options);
        for (const ch of text) yield ch;
        return;
      }

      const chain = getChatModelChain(options.model, options.modelChainRotate ?? 0, runtime);
      let lastError: unknown;
      for (const model of chain) {
        try {
          const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
            method: "POST",
            headers: authHeaders(cfg),
            body: JSON.stringify(buildChatRequestBody(model, messages, { ...options, stream: true })),
          });
          if (!res.ok || !res.body) {
            const body = await res.text();
            throw new Error(`Chat stream failed (${model}): ${res.status} ${body}`);
          }
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let yieldedAny = false;
          let streamDone = false;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const payload = trimmed.slice(5).trim();
              if (payload === "[DONE]") {
                streamDone = true;
                break;
              }
              try {
                const json = JSON.parse(payload) as {
                  choices: { delta?: { content?: string } }[];
                };
                const delta = json.choices[0]?.delta?.content;
                if (delta) {
                  yieldedAny = true;
                  yield delta;
                }
              } catch {
                // ignore partial JSON
              }
            }
            if (streamDone) break;
          }
          if (yieldedAny) return;
          console.warn(`[llm] stream returned empty from ${model}, trying next`);
        } catch (err) {
          lastError = err;
          if (isRateLimitError(err)) {
            const wait = parseRetryAfterMs(err as Error);
            console.warn(`[llm] stream rate limited on ${model}, waiting ${wait}ms then trying next`);
            await sleep(wait);
          } else {
            console.warn(`[llm] stream model failed, trying next: ${model}`, err);
          }
        }
      }

      try {
        const { content } = await chatWithModelFallback(messages, chain, {
          ...options,
          modelChainRotate: options.modelChainRotate,
          runtime,
        });
        if (content.trim()) {
          console.warn("[llm] stream chain empty — falling back to non-stream completion");
          for (const ch of content) yield ch;
          return;
        }
      } catch (err) {
        lastError = err;
      }

      throw lastError instanceof Error
        ? lastError
        : new Error("All LLM stream models failed");
    },
  };
}
