import { vectorSearch, type EmbeddingsClient } from "@quickstart-ai/rag";
import { KNOWLEDGE_GAP_TOP_SCORE } from "@quickstart-ai/shared";
import type { GapCandidate } from "./knowledge-gaps.js";

/** Questions closer than this are treated as the same underlying gap. */
const SIMILARITY_THRESHOLD = 0.85;

/**
 * Ceiling on questions sent to the embeddings API in one request.
 *
 * Providers reject oversized batches outright, which would take the whole page
 * down rather than degrade it. The newest candidates are the ones worth keeping.
 */
const MAX_EMBED_BATCH = 512;

export interface GapGroup {
  question: string;
  sessionCount: number;
  lastAskedAt: Date;
  sessionIds: string[];
  precision: "high" | "low";
  worstTopScore: number | null;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Collapses differently-worded versions of one question into a single row.
 *
 * Without this the page is a transcript rather than a to-do list: one popular
 * missing answer floods it, and the thing worth fixing first is invisible.
 *
 * Greedy single-pass clustering against the first member of each group. Proper
 * agglomerative clustering would be better with hundreds of candidates; at the
 * volumes this page shows (capped below) the difference is not worth the cost.
 */
function clusterByEmbedding(
  candidates: GapCandidate[],
  vectors: number[][],
): { members: GapCandidate[]; indices: number[] }[] {
  const groups: { members: GapCandidate[]; indices: number[] }[] = [];

  candidates.forEach((candidate, i) => {
    const vector = vectors[i];
    if (!vector) return;

    for (const group of groups) {
      const seed = vectors[group.indices[0]!];
      if (seed && cosine(vector, seed) >= SIMILARITY_THRESHOLD) {
        group.members.push(candidate);
        group.indices.push(i);
        return;
      }
    }
    groups.push({ members: [candidate], indices: [i] });
  });

  return groups;
}

/** Most frequent phrasing, falling back to the most recent. */
function representativeQuestion(members: GapCandidate[]): string {
  const counts = new Map<string, number>();
  for (const m of members) {
    const key = m.question.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best = members[0]!;
  let bestCount = 0;
  for (const m of members) {
    const count = counts.get(m.question.toLowerCase()) ?? 0;
    if (count > bestCount) {
      bestCount = count;
      best = m;
    }
  }
  return best.question;
}

/**
 * Groups candidates and drops any the knowledge base can now answer.
 *
 * The embedding computed for clustering is reused verbatim to re-run retrieval, so
 * each group costs one embedding rather than two. Running these as separate passes
 * would double the API spend for identical vectors.
 *
 * Re-checking against live knowledge is what makes the list self-maintaining: a gap
 * disappears once it is genuinely answered, which is stronger than trusting that
 * adding an FAQ worked, and it means no dismiss button and no bookkeeping table.
 */
export async function groupAndResolve(opts: {
  projectId: string;
  candidates: GapCandidate[];
  embeddings: EmbeddingsClient;
  limit: number;
}): Promise<{ groups: GapGroup[]; resolved: number }> {
  const { projectId, candidates, embeddings, limit } = opts;
  if (!candidates.length) return { groups: [], resolved: 0 };

  // Newest first, then bounded: an unbounded batch is a request the provider can
  // reject, and older questions are the least useful to surface anyway.
  const ordered = [...candidates].sort((a, b) => b.askedAt.getTime() - a.askedAt.getTime());
  const batch = ordered.slice(0, MAX_EMBED_BATCH);

  let vectors: number[][] = [];
  try {
    vectors = await embeddings.embed(batch.map((c) => c.question));
  } catch {
    // Fall back to one group per distinct phrasing rather than failing the page.
    vectors = [];
  }

  const clusters = vectors.length
    ? clusterByEmbedding(batch, vectors)
    : groupByExactText(batch);

  clusters.sort((a, b) => b.members.length - a.members.length);

  const groups: GapGroup[] = [];
  let resolved = 0;

  // Resolution runs before the cap, not after: filtering a capped slice would let
  // already-answered clusters occupy result slots and hide real gaps beneath them.
  for (const cluster of clusters) {
    if (groups.length >= limit) break;
    const seedVector = vectors[cluster.indices[0]!];

    if (seedVector) {
      // Same vector that clustered this group, now asked of current knowledge.
      const hits = await vectorSearch(projectId, seedVector, 1).catch(() => []);
      const best = hits[0]?.score ?? 0;
      if (best >= KNOWLEDGE_GAP_TOP_SCORE) {
        resolved += 1;
        continue;
      }
    }

    const members = cluster.members;
    const scores = members
      .map((m) => m.topScore)
      .filter((s): s is number => typeof s === "number");

    groups.push({
      question: representativeQuestion(members),
      sessionCount: new Set(members.map((m) => m.sessionId)).size,
      lastAskedAt: members.reduce(
        (latest, m) => (m.askedAt > latest ? m.askedAt : latest),
        members[0]!.askedAt,
      ),
      sessionIds: [...new Set(members.map((m) => m.sessionId))],
      // A group is only as trustworthy as its weakest evidence.
      precision: members.every((m) => m.precision === "high") ? "high" : "low",
      worstTopScore: scores.length ? Math.min(...scores) : null,
    });
  }

  return { groups, resolved };
}

/** Fallback when embeddings are unavailable: identical wording only. */
function groupByExactText(
  candidates: GapCandidate[],
): { members: GapCandidate[]; indices: number[] }[] {
  const byText = new Map<string, { members: GapCandidate[]; indices: number[] }>();
  candidates.forEach((c, i) => {
    const key = c.question.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
    const existing = byText.get(key);
    if (existing) {
      existing.members.push(c);
      existing.indices.push(i);
    } else {
      byText.set(key, { members: [c], indices: [i] });
    }
  });
  return [...byText.values()];
}
