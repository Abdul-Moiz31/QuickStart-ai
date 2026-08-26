export const EMBEDDING_DIMENSIONS = 1536;
export const DEFAULT_CHUNK_SIZE = 800;
export const DEFAULT_CHUNK_OVERLAP = 120;
export const DEFAULT_TOP_K = 8;
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
export const KNOWLEDGE_GAP_TOP_SCORE = 0.45;
export const RRF_K = 60;

/** Minimum Q&A pairs required before chatbot can go live. */
export const MIN_KNOWLEDGE_QA = 7;

/** Eval pass thresholds (0–1 averages across knowledge Q&A cases). */
export const EVAL_PASS_THRESHOLDS = {
  faithfulness: 0.22,
  answerRelevancy: 0.12,
  expectedOverlap: 0.18,
  minPassRate: 0.55,
} as const;

export const QUEUE_NAMES = {
  INGEST: "ingest",
  EMBED: "embed",
  EVAL: "eval",
  EVENTS: "events",
  EVENTS_RETRY: "events-retry",
} as const;

export const EVENT_LIMITS = {
  webhooksPerProject: 10,
  integrationsPerProject: 5,
  rulesPerProject: 20,
  eventsPerMessage: 5,
  eventsPerMinute: 100,
} as const;

export const PLAN_LIMITS = {
  free: { messagesPerDay: 200, documents: 20, projects: 2 },
  pro: { messagesPerDay: 5000, documents: 500, projects: 20 },
  enterprise: { messagesPerDay: 100_000, documents: 10_000, projects: 200 },
} as const;

export type PlanTier = keyof typeof PLAN_LIMITS;
