import { buildEmbeddingsRuntimeConfig, buildLlmRuntimeConfig, getLlmPublicModelLabel, maskApiKey, resolveModelId, } from "@quickstart-ai/shared";
import { decryptSecret } from "@quickstart-ai/shared/secrets";
/** BYOK override for chat completions (Groq, OpenAI, etc.). */
export function getProjectChatRuntime(project) {
    const cfg = buildLlmRuntimeConfig(project, decryptSecret);
    if (!cfg)
        return undefined;
    return cfg;
}
/** BYOK override for embeddings — platform keys when provider is chat-only. */
export function getProjectEmbeddingsRuntime(project) {
    const cfg = buildEmbeddingsRuntimeConfig(project, decryptSecret);
    if (!cfg)
        return undefined;
    return cfg;
}
/** @deprecated Use getProjectChatRuntime */
export function getProjectLlmRuntime(project) {
    return getProjectChatRuntime(project);
}
export function getProjectLlmPublicSettings(project) {
    let masked = null;
    if (project.llmApiKeyEnc) {
        try {
            masked = maskApiKey(decryptSecret(project.llmApiKeyEnc));
        }
        catch {
            masked = "••••••••";
        }
    }
    return {
        llmProvider: project.llmProvider,
        useOwnLlmKey: project.useOwnLlmKey,
        llmModel: resolveModelId(project.llmProvider, project.llmModel),
        llmModelLabel: getLlmPublicModelLabel(project.llmProvider, resolveModelId(project.llmProvider, project.llmModel)),
        hasLlmKey: Boolean(project.llmApiKeyEnc),
        llmKeyMasked: masked,
    };
}
//# sourceMappingURL=project-llm.js.map