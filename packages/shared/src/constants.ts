export const EMBEDDING_DIMENSIONS = 1536;
export const DEFAULT_CHUNK_SIZE = 800;
export const DEFAULT_CHUNK_OVERLAP = 120;
export const DEFAULT_TOP_K = 8;
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
