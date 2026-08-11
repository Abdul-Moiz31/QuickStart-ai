import { prisma } from "@quickstart-ai/db";
import { DEFAULT_TOP_K, RRF_K } from "@quickstart-ai/shared";
import type { ChatClient, EmbeddingsClient } from "./llm.js";

export interface RetrievedChunk {
  id: string;
  content: string;
  score: number;
  documentId: string;
}

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export async function vectorSearch(
  projectId: string,
  embedding: number[],
  topK = DEFAULT_TOP_K,
): Promise<RetrievedChunk[]> {
  const vector = toVectorLiteral(embedding);
  const rows = await prisma.$queryRawUnsafe<
    { id: string; content: string; documentId: string; score: number }[]
  >(
    `
    SELECT id, content, "documentId",
           1 - (embedding <=> $1::vector) AS score
    FROM "KnowledgeChunk"
    WHERE "projectId" = $2::uuid
      AND embedding IS NOT NULL
    ORDER BY embedding <=> $1::vector
    LIMIT $3
    `,
    vector,
    projectId,
    topK,
  );
  return rows.map((r) => ({
    id: r.id,
    content: r.content,
    documentId: r.documentId,
    score: Number(r.score),
  }));
}

export async function keywordSearch(
  projectId: string,
  query: string,
  topK = DEFAULT_TOP_K,
): Promise<RetrievedChunk[]> {
  const rows = await prisma.$queryRawUnsafe<
    { id: string; content: string; documentId: string; score: number }[]
  >(
    `
    SELECT id, content, "documentId",
           ts_rank_cd(content_tsv, plainto_tsquery('english', $1)) AS score
    FROM "KnowledgeChunk"
    WHERE "projectId" = $2::uuid
      AND content_tsv @@ plainto_tsquery('english', $1)
    ORDER BY score DESC
    LIMIT $3
    `,
    query,
    projectId,
    topK,
  );
  return rows.map((r) => ({
    id: r.id,
    content: r.content,
    documentId: r.documentId,
    score: Number(r.score),
  }));
}

/** Reciprocal Rank Fusion of vector + keyword results. */
export function fuseRRF(
  lists: RetrievedChunk[][],
  k = RRF_K,
): RetrievedChunk[] {
  const scores = new Map<string, RetrievedChunk & { rrf: number }>();
  for (const list of lists) {
    list.forEach((item, idx) => {
      const prev = scores.get(item.id);
      const add = 1 / (k + idx + 1);
      if (prev) {
        prev.rrf += add;
        prev.score = Math.max(prev.score, item.score);
      } else {
        scores.set(item.id, { ...item, rrf: add });
      }
    });
  }
  return [...scores.values()]
    .sort((a, b) => b.rrf - a.rrf)
    .map(({ rrf: _rrf, ...rest }) => rest);
}

/** HyDE: generate a hypothetical answer, embed it, and search. */
export async function hydeRetrieve(opts: {
  projectId: string;
  query: string;
  embeddings: EmbeddingsClient;
  chat: ChatClient;
  topK?: number;
}): Promise<RetrievedChunk[]> {
  const { projectId, query, embeddings, chat, topK = DEFAULT_TOP_K } = opts;
  const hypo = await chat.chat(
    [
      {
        role: "system",
        content:
          "Write a short hypothetical passage that would answer the user question as if from a business knowledge base. No preamble.",
      },
      { role: "user", content: query },
    ],
    { temperature: 0.2, maxTokens: 250 },
  );
  const [emb] = await embeddings.embed([hypo || query]);
  if (!emb) return [];
  return vectorSearch(projectId, emb, topK);
}

export async function hybridRetrieve(opts: {
  projectId: string;
  query: string;
  embeddings: EmbeddingsClient;
  chat: ChatClient;
  useHyde?: boolean;
  topK?: number;
}): Promise<{ chunks: RetrievedChunk[]; method: string }> {
  const { projectId, query, embeddings, chat, useHyde = true, topK = DEFAULT_TOP_K } = opts;
  const [queryEmb] = await embeddings.embed([query]);
  if (!queryEmb) return { chunks: [], method: "empty" };

  const [vectorHits, keywordHits] = await Promise.all([
    vectorSearch(projectId, queryEmb, topK),
    keywordSearch(projectId, query, topK),
  ]);

  let hydeHits: RetrievedChunk[] = [];
  if (useHyde) {
    try {
      hydeHits = await hydeRetrieve({ projectId, query, embeddings, chat, topK });
    } catch {
      hydeHits = [];
    }
  }

  const fused = fuseRRF([vectorHits, keywordHits, hydeHits]).slice(0, topK);
  return {
    chunks: fused,
    method: useHyde ? "hybrid+hyde+rrf" : "hybrid+rrf",
  };
}

/** LLM-based cross-encoder rerank after RRF fusion. */
export async function rerankChunks(
  query: string,
  chunks: RetrievedChunk[],
  chat: ChatClient,
  topK = 8,
): Promise<RetrievedChunk[]> {
  if (chunks.length <= 1) return chunks.slice(0, topK);

  const candidates = chunks.slice(0, 20);
  const numbered = candidates
    .map((c, i) => `[${i}] ${c.content.slice(0, 400)}`)
    .join("\n\n");

  try {
    const raw = await chat.chat(
      [
        {
          role: "system",
          content:
            "Score each passage 0-10 for relevance to the query. Reply JSON only: {\"scores\":[...]} with one score per passage index, same order.",
        },
        { role: "user", content: `Query: ${query}\n\nPassages:\n${numbered}` },
      ],
      { temperature: 0, maxTokens: 200 },
    );
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return candidates.slice(0, topK);
    const parsed = JSON.parse(match[0]) as { scores?: number[] };
    const scores = parsed.scores ?? [];
    const reranked = candidates
      .map((c, i) => ({
        ...c,
        score: typeof scores[i] === "number" ? scores[i]! / 10 : c.score,
      }))
      .sort((a, b) => b.score - a.score);
    return reranked.slice(0, topK);
  } catch {
    return candidates.slice(0, topK);
  }
}

export async function storeChunkEmbeddings(
  chunkIds: string[],
  embeddings: number[][],
): Promise<void> {
  for (let i = 0; i < chunkIds.length; i++) {
    const id = chunkIds[i];
    const emb = embeddings[i];
    if (!id || !emb) continue;
    const vector = toVectorLiteral(emb);
    await prisma.$executeRawUnsafe(
      `UPDATE "KnowledgeChunk" SET embedding = $1::vector WHERE id = $2::uuid`,
      vector,
      id,
    );
  }
}
