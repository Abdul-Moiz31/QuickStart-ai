export type SessionReviewTopicClassification =
  | "faq_gap"
  | "handoff"
  | "chitchat"
  | "resolved";

export interface SessionReviewTopic {
  question: string;
  classification: SessionReviewTopicClassification;
  confidence: number;
  suggestedFaq?: string;
}

export interface SessionReviewMeta {
  reviewedAt: string;
  summary: string;
  topics: SessionReviewTopic[];
}

export function isSessionReviewMeta(value: unknown): value is SessionReviewMeta {
  if (!value || typeof value !== "object") return false;
  const v = value as SessionReviewMeta;
  return (
    typeof v.reviewedAt === "string" &&
    typeof v.summary === "string" &&
    Array.isArray(v.topics)
  );
}
