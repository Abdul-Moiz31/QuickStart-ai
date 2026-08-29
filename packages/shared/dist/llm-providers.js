const TIER_LABEL = {
    free: "Free",
    budget: "Budget",
    balanced: "Balanced",
};
export function tierLabel(tier) {
    return TIER_LABEL[tier];
}
export const LLM_PROVIDER_OPTIONS = [
    {
        id: "platform",
        label: "QuickStart (shared)",
        description: "Platform keys for quick testing — rate limits apply.",
        keyHint: "",
        keyLabel: "",
        defaultBaseUrl: "",
        models: [],
    },
    {
        id: "openrouter",
        label: "OpenRouter",
        description: "One key unlocks GPT, Claude, Gemini, Grok and more. Best for production.",
        keyHint: "sk-or-v1-…",
        keyLabel: "OpenRouter API key",
        defaultBaseUrl: "https://openrouter.ai/api/v1",
        models: [
            {
                id: "openai/gpt-oss-20b:free",
                label: "GPT OSS 20B",
                description: "Free tier — great for dev and light traffic.",
                tier: "free",
            },
            {
                id: "google/gemini-2.0-flash-lite",
                label: "Gemini 2.0 Flash Lite",
                description: "Lowest cost paid option, fast responses.",
                tier: "budget",
            },
            {
                id: "openai/gpt-4o-mini",
                label: "GPT-4o Mini",
                description: "Strong quality at a low price — our top pick.",
                tier: "balanced",
                recommended: true,
            },
            {
                id: "anthropic/claude-3.5-haiku",
                label: "Claude 3.5 Haiku",
                description: "Fast Claude model, excellent for support chat.",
                tier: "budget",
            },
            {
                id: "x-ai/grok-2-1212",
                label: "Grok 2",
                description: "xAI Grok — witty, capable general chat.",
                tier: "balanced",
            },
            {
                id: "mistralai/mistral-nemo",
                label: "Mistral Nemo",
                description: "Reliable fallback when free models rate-limit.",
                tier: "budget",
            },
        ],
    },
    {
        id: "openai",
        label: "OpenAI",
        description: "Direct ChatGPT API — use your OpenAI platform key.",
        keyHint: "sk-…",
        keyLabel: "OpenAI API key",
        defaultBaseUrl: "https://api.openai.com/v1",
        models: [
            {
                id: "gpt-4o-mini",
                label: "GPT-4o Mini",
                description: "Best value — fast, cheap, high quality.",
                tier: "balanced",
                recommended: true,
            },
            {
                id: "gpt-4o",
                label: "GPT-4o",
                description: "Full GPT-4o when you need maximum quality.",
                tier: "balanced",
            },
            {
                id: "gpt-3.5-turbo",
                label: "GPT-3.5 Turbo",
                description: "Legacy budget option.",
                tier: "budget",
            },
        ],
    },
    {
        id: "google",
        label: "Google Gemini",
        description: "Google AI Studio key — Gemini via OpenAI-compatible API.",
        keyHint: "AI…",
        keyLabel: "Google AI API key",
        defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
        models: [
            {
                id: "gemini-2.0-flash-lite",
                label: "Gemini 2.0 Flash Lite",
                description: "Cheapest Gemini — ideal for high volume.",
                tier: "budget",
                recommended: true,
            },
            {
                id: "gemini-2.0-flash",
                label: "Gemini 2.0 Flash",
                description: "Balanced speed and quality.",
                tier: "balanced",
            },
            {
                id: "gemini-1.5-flash",
                label: "Gemini 1.5 Flash",
                description: "Proven stable flash model.",
                tier: "budget",
            },
        ],
    },
    {
        id: "anthropic",
        label: "Claude (OpenRouter)",
        description: "Claude models via OpenRouter — use your OpenRouter key.",
        keyHint: "sk-or-v1-…",
        keyLabel: "OpenRouter API key",
        defaultBaseUrl: "https://openrouter.ai/api/v1",
        models: [
            {
                id: "anthropic/claude-3.5-haiku",
                label: "Claude 3.5 Haiku",
                description: "Fast, affordable Claude for chatbots.",
                tier: "budget",
                recommended: true,
            },
            {
                id: "anthropic/claude-3-haiku",
                label: "Claude 3 Haiku",
                description: "Previous-gen Haiku — still solid and cheap.",
                tier: "budget",
            },
            {
                id: "anthropic/claude-3.5-sonnet",
                label: "Claude 3.5 Sonnet",
                description: "Higher quality when budget allows.",
                tier: "balanced",
            },
        ],
    },
    {
        id: "xai",
        label: "xAI (Grok)",
        description: "Direct xAI API for Grok models.",
        keyHint: "xai-…",
        keyLabel: "xAI API key",
        defaultBaseUrl: "https://api.x.ai/v1",
        supportsEmbeddings: false,
        models: [
            {
                id: "grok-2-1212",
                label: "Grok 2",
                description: "Latest Grok — strong general assistant.",
                tier: "balanced",
                recommended: true,
            },
            {
                id: "grok-2-vision-1212",
                label: "Grok 2 Vision",
                description: "Grok with vision capabilities.",
                tier: "balanced",
            },
        ],
    },
    {
        id: "groq",
        label: "Groq Cloud",
        description: "Ultra-fast chat inference. Knowledge search uses platform embedding keys.",
        keyHint: "gsk_…",
        keyLabel: "Groq API key",
        defaultBaseUrl: "https://api.groq.com/openai/v1",
        supportsEmbeddings: false,
        models: [
            {
                id: "openai/gpt-oss-120b",
                label: "GPT-OSS 120B",
                description: "Groq's recommended production model — replaces Llama 3.3 70B.",
                tier: "balanced",
                recommended: true,
            },
            {
                id: "openai/gpt-oss-20b",
                label: "GPT-OSS 20B",
                description: "Fast and cheap — replaces Llama 3.1 8B Instant.",
                tier: "budget",
            },
            {
                id: "qwen/qwen3.6-27b",
                label: "Qwen 3.6 27B",
                description: "Strong reasoning — Groq preview tier.",
                tier: "balanced",
            },
        ],
    },
];
export function getProviderOption(id) {
    return LLM_PROVIDER_OPTIONS.find((p) => p.id === id);
}
/** BYOK providers that only expose chat completions (not embeddings). */
export function providerSupportsEmbeddings(providerId) {
    const provider = getProviderOption(providerId);
    if (!provider)
        return true;
    return provider.supportsEmbeddings !== false;
}
export function getProviderModels(providerId) {
    return getProviderOption(providerId)?.models ?? [];
}
export function getDefaultModelId(providerId) {
    const provider = getProviderOption(providerId);
    if (!provider?.models.length)
        return "";
    return (provider.models.find((m) => m.recommended)?.id ??
        provider.models[0]?.id ??
        "");
}
export function getModelPreset(providerId, modelId) {
    return getProviderModels(providerId).find((m) => m.id === modelId);
}
/** Groq retired several Llama IDs on 2026-08-16 — map stored values to live models. */
const GROQ_DEPRECATED_MODEL_MAP = {
    "llama-3.3-70b-versatile": "openai/gpt-oss-120b",
    "llama-3.1-8b-instant": "openai/gpt-oss-20b",
    "llama-3.1-70b-versatile": "openai/gpt-oss-120b",
    "gemma2-9b-it": "openai/gpt-oss-20b",
};
/** Pick a valid stored model or fall back to provider default. */
export function resolveModelId(providerId, stored) {
    const models = getProviderModels(providerId);
    if (!models.length)
        return "";
    if (providerId === "groq" && stored && GROQ_DEPRECATED_MODEL_MAP[stored]) {
        stored = GROQ_DEPRECATED_MODEL_MAP[stored];
    }
    if (stored && models.some((m) => m.id === stored))
        return stored;
    return getDefaultModelId(providerId);
}
export function maskApiKey(key) {
    if (key.length <= 8)
        return "••••••••";
    return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}
export function buildLlmRuntimeConfig(project, decryptKey) {
    if (!project.useOwnLlmKey || project.llmProvider === "platform")
        return undefined;
    const provider = getProviderOption(project.llmProvider);
    if (!provider || !project.llmApiKeyEnc)
        return undefined;
    const apiKey = decryptKey(project.llmApiKeyEnc).trim();
    if (!apiKey)
        return undefined;
    const baseUrl = (project.llmBaseUrl || provider.defaultBaseUrl).replace(/\/$/, "");
    const llmModel = resolveModelId(project.llmProvider, project.llmModel);
    if (!llmModel)
        return undefined;
    return {
        apiKey,
        baseUrl,
        llmModel,
        usingOpenRouter: project.llmProvider === "openrouter" ||
            project.llmProvider === "anthropic" ||
            baseUrl.includes("openrouter"),
    };
}
/** Runtime override for embeddings — omitted for chat-only BYOK providers (Groq, xAI). */
export function buildEmbeddingsRuntimeConfig(project, decryptKey) {
    if (!project.useOwnLlmKey || project.llmProvider === "platform")
        return undefined;
    if (!providerSupportsEmbeddings(project.llmProvider))
        return undefined;
    return buildLlmRuntimeConfig(project, decryptKey);
}
export function getLlmPublicModelLabel(providerId, modelId) {
    if (!modelId)
        return "";
    const preset = getModelPreset(providerId, modelId);
    return preset?.label ?? modelId;
}
//# sourceMappingURL=llm-providers.js.map