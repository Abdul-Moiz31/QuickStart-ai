import { getChatSessionModel, type ChatSessionDoc } from "@quickstart-ai/db";
import { BUILTIN_EVENT_TYPES } from "@quickstart-ai/shared";
import { classifyAnswer } from "./knowledge-gaps.js";

type SessionMessage = ChatSessionDoc["messages"][number];

export const ANALYTICS_PERIODS = ["7d", "30d", "90d"] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export interface ProjectAnalytics {
  totalConversations: number;
  totalMessages: number;
  avgMessagesPerSession: number;
  analysedAnswers: number;
  answerQuality: number | null;
  qualityBreakdown: { strong: number; weak: number; unscored: number };
  escalationRate: number;
  leadCaptureRate: number;
  dailyVolume: { date: string; count: number }[];
  topToolsUsed: { tool: string; count: number }[];
}

function messageMeta(m: SessionMessage): {
  toolsUsed?: string[];
  events?: string[];
  suppressed?: boolean;
} {
  return (m.meta ?? {}) as { toolsUsed?: string[]; events?: string[]; suppressed?: boolean };
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Zero-filled so a quiet day is a gap in the bars, not a missing column. */
function emptyVolume(since: Date, until: Date): Map<string, number> {
  const days = new Map<string, number>();
  const cursor = new Date(Date.UTC(since.getUTCFullYear(), since.getUTCMonth(), since.getUTCDate()));
  while (cursor <= until) {
    days.set(dayKey(cursor), 0);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

function rate(part: number, whole: number): number {
  return whole === 0 ? 0 : part / whole;
}

export async function computeProjectAnalytics(opts: {
  projectId: string;
  since: Date;
}): Promise<ProjectAnalytics> {
  const Session = getChatSessionModel();
  const sessions = await Session.find({
    projectId: opts.projectId,
    updatedAt: { $gte: opts.since },
  })
    .select("messages escalatedAt")
    .lean();

  const now = new Date();
  const volume = emptyVolume(opts.since, now);
  const tools = new Map<string, number>();

  let totalConversations = 0;
  let totalMessages = 0;
  let analysedAnswers = 0;
  let strong = 0;
  let weak = 0;
  let unscored = 0;
  let escalatedSessions = 0;
  let leadSessions = 0;

  for (const session of sessions) {
    const messages = session.messages ?? [];
    let sessionMessages = 0;
    let escalated = Boolean(
      session.escalatedAt && new Date(session.escalatedAt) >= opts.since,
    );
    let captured = false;

    messages.forEach((m, i) => {
      const at = (m as { createdAt?: Date }).createdAt;
      if (!at || at < opts.since) return;

      if (m.role === "user") {
        sessionMessages += 1;
        totalMessages += 1;
        const key = dayKey(new Date(at));
        if (volume.has(key)) volume.set(key, (volume.get(key) ?? 0) + 1);
        return;
      }

      if (m.role !== "assistant") return;

      const meta = messageMeta(m);
      if (meta.events?.includes(BUILTIN_EVENT_TYPES.HUMAN_HANDOFF)) escalated = true;
      if (meta.events?.includes(BUILTIN_EVENT_TYPES.LEAD_CAPTURED)) captured = true;

      // A human took this turn over, so the visitor never saw the bot's draft.
      // It says nothing about how well the knowledge base performed.
      if (meta.suppressed) return;

      const prevTurn = messages[i - 1];
      if (!prevTurn || prevTurn.role !== "user") return;

      analysedAnswers += 1;
      for (const tool of meta.toolsUsed ?? []) {
        // Fires on every answer, so it would flatten every other bar.
        if (tool === "search_knowledge") continue;
        tools.set(tool, (tools.get(tool) ?? 0) + 1);
      }

      const { isGap, topScore } = classifyAnswer(m);
      if (topScore === null) unscored += 1;
      else if (isGap) weak += 1;
      else strong += 1;
    });

    if (sessionMessages === 0) continue;
    totalConversations += 1;
    if (escalated) escalatedSessions += 1;
    if (captured) leadSessions += 1;
  }

  const scored = strong + weak;

  return {
    totalConversations,
    totalMessages,
    avgMessagesPerSession: rate(totalMessages, totalConversations),
    analysedAnswers,
    answerQuality: scored === 0 ? null : strong / scored,
    qualityBreakdown: { strong, weak, unscored },
    escalationRate: rate(escalatedSessions, totalConversations),
    leadCaptureRate: rate(leadSessions, totalConversations),
    dailyVolume: [...volume.entries()].map(([date, count]) => ({ date, count })),
    topToolsUsed: [...tools.entries()]
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export function analyticsCacheKey(projectId: string, period: string): string {
  return `analytics:${projectId}:${period}`;
}
