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
  ONBOARDING_SCAN: "onboarding-scan",
} as const;

/** Ordered stages reported by the onboarding website-scan job's progress. */
export const ONBOARDING_SCAN_STAGES = [
  "reading",
  "scanning",
  "knowledge",
  "questions",
] as const;
export type OnboardingScanStage = (typeof ONBOARDING_SCAN_STAGES)[number];

export interface OnboardingScanProgress {
  stage: OnboardingScanStage;
  pct: number;
}

export interface OnboardingScanResult {
  questions: string[];
  /** Draft answers from website research — user can edit before saving. */
  suggestedAnswers: string[];
  model: string | null;
  researchedWebsite: boolean;
  scannedPageCount: number;
  businessLocation?: string;
  supportEmail?: string;
}

export const EVENT_LIMITS = {
  webhooksPerProject: 10,
  integrationsPerProject: 5,
  rulesPerProject: 20,
  eventsPerMessage: 5,
  eventsPerMinute: 100,
} as const;

export const PLAN_LIMITS = {
  free: { messagesPerDay: 200, documents: 20, projects: 2, teamMembers: 1 },
  pro: { messagesPerDay: 5000, documents: 500, projects: 20, teamMembers: 5 },
  enterprise: { messagesPerDay: 100_000, documents: 10_000, projects: 200, teamMembers: 10_000 },
} as const;

export const CUSTOM_TOOL_LIMITS = {
  maxPerProject: 20,
  callsPerMinutePerTool: 10,
  executionTimeoutMs: 5_000,
  maxResponseBytes: 4096,
} as const;

export type PlanTier = keyof typeof PLAN_LIMITS;

/** Display name stored on sessions when the visitor did not identify themselves. */
export const ANONYMOUS_VISITOR_NAME = "Anonymous visitor";

/** Email domain for generated anonymous session identities. */
export const ANONYMOUS_VISITOR_EMAIL_DOMAIN = "visitor.local";

const ANONYMOUS_EMAIL_RE = /^anon-[a-f0-9]+@visitor\.local$/i;

/** True for generated anonymous placeholder emails (not legacy guest fallback). */
export function isAnonymousVisitor(email: string | null | undefined): boolean {
  if (!email) return false;
  return ANONYMOUS_EMAIL_RE.test(email.trim());
}

/** Build a unique anonymous email for a new chat session. */
export function generateAnonymousVisitorEmail(): string {
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `anon-${id}@${ANONYMOUS_VISITOR_EMAIL_DOMAIN}`;
}

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
export function resolveVisitorIdentity(
  input: VisitorIdentityInput,
  allowAnonymousSessions: boolean,
): ResolvedVisitorIdentity {
  const name = input.visitorName?.trim() ?? "";
  const email = input.visitorEmail?.trim() ?? "";
  const hasName = name.length > 0;
  const hasEmail = email.length > 0;

  if (hasName && hasEmail) {
    if (name.length > 120) throw new Error("Name must be at most 120 characters");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email address");
    return { visitorName: name, visitorEmail: email, anonymous: false };
  }

  if (hasName !== hasEmail) {
    throw new Error("Both name and email are required, or leave both empty for anonymous chat");
  }

  if (!allowAnonymousSessions) {
    throw new Error("Name and email are required to start a chat");
  }

  return {
    visitorName: ANONYMOUS_VISITOR_NAME,
    visitorEmail: generateAnonymousVisitorEmail(),
    anonymous: true,
  };
}
