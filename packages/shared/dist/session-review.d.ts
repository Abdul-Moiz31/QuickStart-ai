export type SessionReviewTopicClassification = "faq_gap" | "handoff" | "chitchat" | "resolved";
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
export declare function isSessionReviewMeta(value: unknown): value is SessionReviewMeta;
//# sourceMappingURL=session-review.d.ts.map