export declare const EMBEDDING_DIMENSIONS = 1536;
export declare const DEFAULT_CHUNK_SIZE = 800;
export declare const DEFAULT_CHUNK_OVERLAP = 120;
export declare const DEFAULT_TOP_K = 8;
/**
 * A retrieved chunk at or above this score counts as a real answer.
 *
 * Gaps are judged on the single best chunk, not the average of DEFAULT_TOP_K.
 * Retrieval always returns topK rows with no score floor, so an irrelevant tail
 * drags the mean down even when the top hit is excellent — averaging cannot tell
 * "best match 0.85" apart from "best match 0.30", and only the second is a gap.
 *
 * Starting value, not a derived one: observed genuine gaps top out near 0.30 and
 * good matches clear 0.5. Retune once the gaps page has real traffic behind it.
 */
export declare const KNOWLEDGE_GAP_TOP_SCORE = 0.45;
export declare const RRF_K = 60;
/** Minimum Q&A pairs required before chatbot can go live. */
export declare const MIN_KNOWLEDGE_QA = 7;
/** Eval pass thresholds (0–1 averages across knowledge Q&A cases). */
export declare const EVAL_PASS_THRESHOLDS: {
    readonly faithfulness: 0.22;
    readonly answerRelevancy: 0.12;
    readonly expectedOverlap: 0.18;
    readonly minPassRate: 0.55;
};
export declare const QUEUE_NAMES: {
    readonly INGEST: "ingest";
    readonly EMBED: "embed";
    readonly EVAL: "eval";
    readonly EVENTS: "events";
    readonly EVENTS_RETRY: "events-retry";
};
export declare const EVENT_LIMITS: {
    readonly webhooksPerProject: 10;
    readonly integrationsPerProject: 5;
    readonly rulesPerProject: 20;
    readonly eventsPerMessage: 5;
    readonly eventsPerMinute: 100;
};
export declare const PLAN_LIMITS: {
    readonly free: {
        readonly messagesPerDay: 200;
        readonly documents: 20;
        readonly projects: 2;
    };
    readonly pro: {
        readonly messagesPerDay: 5000;
        readonly documents: 500;
        readonly projects: 20;
    };
    readonly enterprise: {
        readonly messagesPerDay: 100000;
        readonly documents: 10000;
        readonly projects: 200;
    };
};
export declare const CUSTOM_TOOL_LIMITS: {
    readonly maxPerProject: 20;
    readonly callsPerMinutePerTool: 10;
    readonly executionTimeoutMs: 5000;
    readonly maxResponseBytes: 4096;
};
export type PlanTier = keyof typeof PLAN_LIMITS;
/** Display name stored on sessions when the visitor did not identify themselves. */
export declare const ANONYMOUS_VISITOR_NAME = "Anonymous visitor";
/** Email domain for generated anonymous session identities. */
export declare const ANONYMOUS_VISITOR_EMAIL_DOMAIN = "visitor.local";
/** True for generated anonymous placeholder emails (not legacy guest fallback). */
export declare function isAnonymousVisitor(email: string | null | undefined): boolean;
/** Build a unique anonymous email for a new chat session. */
export declare function generateAnonymousVisitorEmail(): string;
export interface VisitorIdentityInput {
    visitorName?: string;
    visitorEmail?: string;
}
export interface ResolvedVisitorIdentity {
    visitorName: string;
    visitorEmail: string;
    anonymous: boolean;
}
/**
 * Resolve session identity from request body + project setting.
 * Throws Error with message suitable for 400 responses.
 */
export declare function resolveVisitorIdentity(input: VisitorIdentityInput, allowAnonymousSessions: boolean): ResolvedVisitorIdentity;
//# sourceMappingURL=constants.d.ts.map