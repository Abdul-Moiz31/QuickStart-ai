import type { ChatClient, EmbeddingsClient, LLMMessage } from "./llm.js";
import { type RetrievedChunk } from "./retrieve.js";
import { type CustomToolRuntime } from "./custom-tools.js";
export interface ToolEventPayload {
    type: string;
    name?: string;
    description?: string;
    payload: Record<string, unknown>;
}
export interface ToolExecutionResult {
    output: string;
    event?: ToolEventPayload;
}
export interface AgentTool {
    name: string;
    description: string;
    execute: (args: Record<string, unknown>) => Promise<ToolExecutionResult>;
}
export interface AgentResult {
    answer: string;
    chunks: RetrievedChunk[];
    toolsUsed: string[];
    confidence: "high" | "medium" | "low";
    /**
     * Best raw retrieval score, taken before reranking.
     *
     * `chunks[].score` is overwritten by rerankChunks with an LLM 0-10 judgement
     * divided by 10, so it is not comparable with a vectorSearch cosine. Callers
     * that need to compare retrieval quality against a later search must use this.
     */
    retrievalTopScore: number;
    eventsEmitted: ToolEventPayload[];
}
export declare function buildAgentTools(ctx: {
    projectId: string;
    projectName: string;
    businessHours?: string;
    businessWebsite?: string;
    chunks: RetrievedChunk[];
    toolsWebSearch?: boolean;
    toolsHumanHandoff?: boolean;
    toolsLeadCapture?: boolean;
    visitorEmail?: string;
    visitorName?: string;
    userMessage?: string;
    customTools?: CustomToolRuntime[];
    redisUrl?: string;
}): AgentTool[];
/** Appended to every agent reply so answers fit the embed widget. */
export declare const WIDGET_REPLY_GUIDELINES: string;
export declare function buildAgentSystemPrompt(projectName: string, custom?: string): string;
export declare function runAgenticRag(opts: {
    projectId: string;
    projectName: string;
    systemPrompt?: string;
    query: string;
    history: LLMMessage[];
    embeddings: EmbeddingsClient;
    chat: ChatClient;
    businessHours?: string;
    businessWebsite?: string;
    useHyde?: boolean;
    modelChainRotate?: number;
    toolsWebSearch?: boolean;
    toolsHumanHandoff?: boolean;
    toolsLeadCapture?: boolean;
    visitorName?: string;
    visitorEmail?: string;
    customTools?: CustomToolRuntime[];
    redisUrl?: string;
}): Promise<AgentResult>;
export interface AgentStreamPreamble {
    chunks: RetrievedChunk[];
    toolsUsed: string[];
    confidence: AgentResult["confidence"];
    /** See AgentResult.retrievalTopScore. */
    retrievalTopScore: number;
    eventsEmitted: ToolEventPayload[];
    /** Messages for the final answer step — used to retry when streaming yields nothing. */
    answerMessages: LLMMessage[];
}
type AgentRagOpts = Parameters<typeof runAgenticRag>[0];
/**
 * Streaming variant of runAgenticRag. Yields real LLM tokens from the final
 * answer step and returns a preamble with metadata on completion. The
 * retrieval + planning phase runs to completion first (cannot be streamed),
 * then the answer generation streams token-by-token.
 */
export declare function runAgenticRagStream(opts: AgentRagOpts): AsyncGenerator<string, AgentStreamPreamble, undefined>;
export {};
//# sourceMappingURL=agent.d.ts.map