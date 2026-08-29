import type { ChatClient, EmbeddingsClient } from "./llm.js";
export interface RetrievedChunk {
    id: string;
    content: string;
    score: number;
    documentId: string;
}
export declare function vectorSearch(projectId: string, embedding: number[], topK?: number): Promise<RetrievedChunk[]>;
export declare function keywordSearch(projectId: string, query: string, topK?: number): Promise<RetrievedChunk[]>;
/** Reciprocal Rank Fusion of vector + keyword results. */
export declare function fuseRRF(lists: RetrievedChunk[][], k?: number): RetrievedChunk[];
/** HyDE: generate a hypothetical answer, embed it, and search. */
export declare function hydeRetrieve(opts: {
    projectId: string;
    query: string;
    embeddings: EmbeddingsClient;
    chat: ChatClient;
    topK?: number;
}): Promise<RetrievedChunk[]>;
export declare function hybridRetrieve(opts: {
    projectId: string;
    query: string;
    embeddings: EmbeddingsClient;
    chat: ChatClient;
    useHyde?: boolean;
    topK?: number;
}): Promise<{
    chunks: RetrievedChunk[];
    method: string;
}>;
/** LLM-based cross-encoder rerank after RRF fusion. */
export declare function rerankChunks(query: string, chunks: RetrievedChunk[], chat: ChatClient, topK?: number): Promise<RetrievedChunk[]>;
export declare function storeChunkEmbeddings(chunkIds: string[], embeddings: number[][]): Promise<void>;
//# sourceMappingURL=retrieve.d.ts.map