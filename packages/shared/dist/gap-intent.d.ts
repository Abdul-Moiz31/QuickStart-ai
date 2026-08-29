export declare function normalizeGapQuestion(question: string): string;
/**
 * Whether a user message should never count as a knowledge gap.
 * Covers greetings, acknowledgments, and handoff intent.
 */
export declare function isGapExcludedUserMessage(message: string): boolean;
/** Assistant turn already escalated to a human — not a KB coverage gap. */
export declare function isHandoffAssistantTurn(meta: {
    events?: string[];
} | undefined): boolean;
/**
 * Combined check used by gap collection and real-time heuristics.
 */
export declare function shouldExcludeFromGaps(userMessage: string, assistantMeta?: {
    events?: string[];
}): boolean;
//# sourceMappingURL=gap-intent.d.ts.map