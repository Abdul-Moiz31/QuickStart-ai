import { getChatSessionModel, type ChatSessionDoc } from "@quickstart-ai/db";
import {
  isSessionReviewMeta,
  normalizeGapQuestion,
  type SessionReviewMeta,
  type SessionReviewTopicClassification,
} from "@quickstart-ai/shared";

export interface ReviewGapCandidate {
  sessionId: string;
  question: string;
  askedAt: Date;
  source: "review";
  classification: SessionReviewTopicClassification;
  confidence: number;
  suggestedFaq?: string;
  sessionSummary?: string;
}

export interface SessionReviewRow {
  sessionId: string;
  visitorName: string;
  reviewedAt: string;
  summary: string;
  topics: SessionReviewMeta["topics"];
  messageCount: number;
}

export async function collectReviewGapCandidates(opts: {
  projectId: string;
  since: Date;
}): Promise<ReviewGapCandidate[]> {
  const Session = getChatSessionModel();
  const sessions = await Session.find({
    projectId: opts.projectId,
    updatedAt: { $gte: opts.since },
    reviewMeta: { $ne: null },
  })
    .select("messages reviewMeta memorySummary visitorName updatedAt")
    .lean();

  const candidates: ReviewGapCandidate[] = [];

  for (const session of sessions) {
    const reviewMeta = session.reviewMeta as SessionReviewMeta | null | undefined;
    if (!reviewMeta || !isSessionReviewMeta(reviewMeta)) continue;
    const reviewedAt = new Date(reviewMeta.reviewedAt);
    if (Number.isNaN(reviewedAt.getTime()) || reviewedAt < opts.since) continue;

    for (const topic of reviewMeta.topics) {
      if (topic.classification !== "faq_gap") continue;
      if (!topic.question.trim()) continue;
      candidates.push({
        sessionId: String(session._id),
        question: topic.question.trim(),
        askedAt: reviewedAt,
        source: "review",
        classification: topic.classification,
        confidence: topic.confidence,
        suggestedFaq: topic.suggestedFaq,
        sessionSummary: reviewMeta.summary,
      });
    }
  }

  return candidates;
}

export async function listSessionReviews(opts: {
  projectId: string;
  since: Date;
  limit?: number;
}): Promise<SessionReviewRow[]> {
  const Session = getChatSessionModel();
  const sessions = await Session.find({
    projectId: opts.projectId,
    reviewMeta: { $ne: null },
    updatedAt: { $gte: opts.since },
  })
    .select("visitorName messages reviewMeta updatedAt")
    .sort({ updatedAt: -1 })
    .limit(opts.limit ?? 30)
    .lean();

  const rows: SessionReviewRow[] = [];
  for (const session of sessions) {
    const reviewMeta = session.reviewMeta as SessionReviewMeta | null | undefined;
    if (!reviewMeta || !isSessionReviewMeta(reviewMeta)) continue;
    rows.push({
      sessionId: String(session._id),
      visitorName: session.visitorName,
      reviewedAt: reviewMeta.reviewedAt,
      summary: reviewMeta.summary,
      topics: reviewMeta.topics,
      messageCount: (session.messages ?? []).length,
    });
  }
  return rows;
}

/** Dedupe review gaps against retrieval gaps by normalized question text. */
export function mergeReviewGaps<T extends { question: string }>(
  retrievalGaps: T[],
  reviewCandidates: ReviewGapCandidate[],
): Array<
  T | (ReviewGapCandidate & { sessionCount: number; lastAskedAt: Date; precision: "high"; topScore: null })
> {
  const seen = new Set(retrievalGaps.map((g) => normalizeGapQuestion(g.question)));
  const merged: Array<
    T | (ReviewGapCandidate & { sessionCount: number; lastAskedAt: Date; precision: "high"; topScore: null })
  > = [...retrievalGaps];

  for (const candidate of reviewCandidates) {
    const key = normalizeGapQuestion(candidate.question);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      ...candidate,
      sessionCount: 1,
      lastAskedAt: candidate.askedAt,
      precision: "high",
      topScore: null,
    });
  }

  return merged;
}

export type { ChatSessionDoc };
