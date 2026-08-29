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
/**
 * Onboarding question generation: try free OpenRouter models first, then cheapest paid.
 * Order: rotate less rate-limited free models before gemma variants.
 */
export declare const ONBOARDING_FREE_MODELS: readonly ["openai/gpt-oss-20b:free", "nvidia/nemotron-3-nano-30b-a3b:free", "google/gemma-4-31b-it:free", "nvidia/nemotron-3-super-120b-a12b:free", "google/gemma-4-26b-a4b-it:free"];
/** Cheap, solid instruction model when free tier fails / rate-limits. */
export declare const ONBOARDING_PAID_FALLBACK_MODEL = "mistralai/mistral-nemo";
export declare const ONBOARDING_MODEL_CHAIN: readonly ["openai/gpt-oss-20b:free", "nvidia/nemotron-3-nano-30b-a3b:free", "google/gemma-4-31b-it:free", "nvidia/nemotron-3-super-120b-a12b:free", "google/gemma-4-26b-a4b-it:free", "mistralai/mistral-nemo"];
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
export declare function createEmbeddingsClient(runtime?: Partial<LlmRuntimeConfig>): EmbeddingsClient;
/**
 * Try models in order until one returns usable content.
 * Used for onboarding (5 free → 1 cheap paid) and optional general fallbacks.
 */
export declare function chatWithModelFallback(messages: LLMMessage[], models: readonly string[], options?: ChatOptions & {
    runtime?: Partial<LlmRuntimeConfig>;
}): Promise<{
    content: string;
    model: string;
}>;
/** Default chat chain: free models first, then cheap paid. */
export declare const CHAT_MODEL_CHAIN: readonly ["openai/gpt-oss-20b:free", "nvidia/nemotron-3-nano-30b-a3b:free", "google/gemma-4-31b-it:free", "nvidia/nemotron-3-super-120b-a12b:free", "google/gemma-4-26b-a4b-it:free", "mistralai/mistral-nemo"];
export declare function createChatClient(runtime?: Partial<LlmRuntimeConfig>): ChatClient;
//# sourceMappingURL=llm.d.ts.map