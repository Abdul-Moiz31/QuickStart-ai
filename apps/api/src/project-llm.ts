import {
  buildLlmRuntimeConfig,
  getLlmPublicModelLabel,
  maskApiKey,
  resolveModelId,
  type ProjectLlmFields,
} from "@quickstart-ai/shared";
import { decryptSecret } from "@quickstart-ai/shared/secrets";
import type { LlmRuntimeConfig } from "@quickstart-ai/rag";

export function getProjectLlmRuntime(project: ProjectLlmFields): Partial<LlmRuntimeConfig> | undefined {
  const cfg = buildLlmRuntimeConfig(project, decryptSecret);
  if (!cfg) return undefined;
  return cfg;
}

export function getProjectLlmPublicSettings(project: ProjectLlmFields) {
  let masked: string | null = null;
  if (project.llmApiKeyEnc) {
    try {
      masked = maskApiKey(decryptSecret(project.llmApiKeyEnc));
    } catch {
      masked = "••••••••";
    }
  }
  return {
    llmProvider: project.llmProvider,
    useOwnLlmKey: project.useOwnLlmKey,
    llmModel: resolveModelId(project.llmProvider, project.llmModel),
    llmModelLabel: getLlmPublicModelLabel(
      project.llmProvider,
      resolveModelId(project.llmProvider, project.llmModel),
    ),
    hasLlmKey: Boolean(project.llmApiKeyEnc),
    llmKeyMasked: masked,
  };
}
