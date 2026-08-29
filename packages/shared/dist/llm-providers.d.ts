export type LlmProviderId = "platform" | "openrouter" | "openai" | "google" | "anthropic" | "xai" | "groq";
export type LlmModelTier = "free" | "budget" | "balanced";
export type LlmModelPreset = {
    id: string;
    label: string;
    description: string;
    tier: LlmModelTier;
    recommended?: boolean;
};
export type LlmProviderOption = {
    id: LlmProviderId;
    label: string;
    description: string;
    keyHint: string;
    keyLabel: string;
    defaultBaseUrl: string;
    /** Chat-only providers (e.g. Groq) — embeddings stay on platform keys. */
    supportsEmbeddings?: boolean;
    models: LlmModelPreset[];
};
export declare function tierLabel(tier: LlmModelTier): string;
export declare const LLM_PROVIDER_OPTIONS: LlmProviderOption[];
export declare function getProviderOption(id: string): LlmProviderOption | undefined;
/** BYOK providers that only expose chat completions (not embeddings). */
export declare function providerSupportsEmbeddings(providerId: string): boolean;
export declare function getProviderModels(providerId: string): LlmModelPreset[];
export declare function getDefaultModelId(providerId: string): string;
export declare function getModelPreset(providerId: string, modelId: string): LlmModelPreset | undefined;
/** Pick a valid stored model or fall back to provider default. */
export declare function resolveModelId(providerId: string, stored: string | null | undefined): string;
export declare function maskApiKey(key: string): string;
export type ProjectLlmFields = {
    llmProvider: string;
    useOwnLlmKey: boolean;
    llmApiKeyEnc: string | null;
    llmModel: string | null;
    llmBaseUrl: string | null;
};
export type LlmRuntimeConfig = {
    apiKey: string;
    baseUrl: string;
    llmModel: string;
    usingOpenRouter: boolean;
};
export declare function buildLlmRuntimeConfig(project: ProjectLlmFields, decryptKey: (enc: string) => string): LlmRuntimeConfig | undefined;
/** Runtime override for embeddings — omitted for chat-only BYOK providers (Groq, xAI). */
export declare function buildEmbeddingsRuntimeConfig(project: ProjectLlmFields, decryptKey: (enc: string) => string): LlmRuntimeConfig | undefined;
export declare function getLlmPublicModelLabel(providerId: string, modelId: string | null): string;
//# sourceMappingURL=llm-providers.d.ts.map