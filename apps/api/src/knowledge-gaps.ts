import { getChatSessionModel, type ChatSessionDoc } from "@quickstart-ai/db";
import { KNOWLEDGE_GAP_TOP_SCORE } from "@quickstart-ai/shared";

/** One weak answer, paired with the question that produced it. */
export interface GapCandidate {
  sessionId: string;
  question: string;
  askedAt: Date;
  topScore: number | null;
  /**
   * "low" for rows selected by the legacy confidence average, which reports a
   * strong top hit as weak whenever the retrieved tail is poor. Surfaced so the
   * UI can mark them as less trustworthy than rows carrying a real topScore.
   */
  precision: "high" | "low";
}

type SessionMessage = ChatSessionDoc["messages"][number];

function messageMeta(m: SessionMessage): {
  confidence?: string;
  topScore?: number;
  suppressed?: boolean;
} {
  return (m.meta ?? {}) as { confidence?: string; topScore?: number; suppressed?: boolean };
}

/**
 * Whether an answer was weak enough to count as a gap.
 *
 * topScore is authoritative when present. Messages written before it existed only
 * carry the averaged confidence, which is kept as a fallback so the page has
 * history on day one rather than waiting for new traffic.
 */
export function classifyAnswer(
  m: SessionMessage,
): { isGap: boolean; topScore: number | null; precision: "high" | "low" } {
  const meta = messageMeta(m);
  if (typeof meta.topScore === "number") {
    return {
      isGap: meta.topScore < KNOWLEDGE_GAP_TOP_SCORE,
      topScore: meta.topScore,
      precision: "high",
    };
  }
  return { isGap: meta.confidence === "low", topScore: null, precision: "low" };
}

/**
 * Pulls weak answers out of a project's sessions and pairs each with its question.
 *
 * Sessions are the source rather than ProjectEvent: the knowledge.gap event only
 * fired when retrieval returned zero chunks, which never happens once a project has
 * knowledge, so that table holds nothing. Sessions also survive the fire-and-forget
 * event bus, and they already store what is needed.
 */
export async function collectGapCandidates(opts: {
  projectId: string;
  since: Date;
}): Promise<GapCandidate[]> {
  const Session = getChatSessionModel();
  const sessions = await Session.find({
    projectId: opts.projectId,
    updatedAt: { $gte: opts.since },
  })
    .select("messages")
    .lean();

  const candidates: GapCandidate[] = [];

  for (const session of sessions) {
    const messages = session.messages ?? [];
    messages.forEach((m, i) => {
      if (m.role !== "assistant") return;

      const meta = messageMeta(m);
      // Superseded by a human takeover; the visitor never saw it, so it says
      // nothing about whether the knowledge base could answer.
      if (meta.suppressed) return;

      const { isGap, topScore, precision } = classifyAnswer(m);
      if (!isGap) return;

      // chat.ts always pushes the user turn immediately before the assistant turn,
      // so the previous message is the question. The seeded greeting has no
      // preceding user turn and is skipped by the same check.
      const prev = messages[i - 1];
      if (!prev || prev.role !== "user") return;

      const question = prev.content.trim();
      if (!question) return;

      const askedAt = (m as { createdAt?: Date }).createdAt ?? new Date();
      if (askedAt < opts.since) return;

      candidates.push({
        sessionId: String(session._id),
        question,
        askedAt,
        topScore,
        precision,
      });
    });
  }

  return candidates;
}

export function periodToSince(period: string): Date {
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
