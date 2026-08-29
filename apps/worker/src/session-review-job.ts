import { connectMongo, getChatSessionModel, prisma } from "@quickstart-ai/db";
import { createChatClient } from "@quickstart-ai/rag";
import {
  buildLlmRuntimeConfig,
  isSessionReviewMeta,
  type SessionReviewMeta,
  type SessionReviewTopic,
} from "@quickstart-ai/shared";
import { decryptSecret } from "@quickstart-ai/shared/secrets";

const MIN_USER_TURNS = 2;

function formatTranscript(messages: { role: string; content: string }[]): string {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => `${m.role === "user" ? "Visitor" : "Bot"}: ${m.content}`)
    .join("\n");
}

function parseReviewJson(raw: string): SessionReviewMeta | null {
  const trimmed = raw.trim();
  const jsonBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? trimmed;
  try {
    const parsed = JSON.parse(jsonBlock) as {
      summary?: string;
      topics?: SessionReviewTopic[];
    };
    if (!parsed.summary || !Array.isArray(parsed.topics)) return null;
    const topics = parsed.topics
      .filter(
        (t) =>
          t &&
          typeof t.question === "string" &&
          typeof t.classification === "string" &&
          typeof t.confidence === "number",
      )
      .map((t) => ({
        question: t.question.trim(),
        classification: t.classification,
        confidence: t.confidence,
        ...(t.suggestedFaq ? { suggestedFaq: t.suggestedFaq } : {}),
      }));
    return {
      reviewedAt: new Date().toISOString(),
      summary: parsed.summary.trim(),
      topics,
    };
  } catch {
    return null;
  }
}

export async function runSessionReview(opts: {
  projectId: string;
  sessionId: string;
}): Promise<{ skipped: boolean; reason?: string }> {
  await connectMongo();
  const Session = getChatSessionModel();
  const session = await Session.findOne({
    _id: opts.sessionId,
    projectId: opts.projectId,
  });

  if (!session) return { skipped: true, reason: "session_not_found" };

  const userTurns = (session.messages ?? []).filter((m) => m.role === "user");
  if (userTurns.length < MIN_USER_TURNS) {
    return { skipped: true, reason: "too_few_turns" };
  }

  const existing = session.reviewMeta as SessionReviewMeta | null | undefined;
  if (existing?.reviewedAt && isSessionReviewMeta(existing)) {
    const reviewedAt = new Date(existing.reviewedAt);
    if (session.updatedAt <= reviewedAt) {
      return { skipped: true, reason: "already_reviewed" };
    }
  }

  const project = await prisma.project.findUnique({ where: { id: opts.projectId } });
  if (!project) return { skipped: true, reason: "project_not_found" };

  const chat = createChatClient(buildLlmRuntimeConfig(project, decryptSecret));
  const transcript = formatTranscript(session.messages ?? []);

  const prompt = [
    "You analyze customer support chat transcripts for a business chatbot.",
    "Return ONLY valid JSON (no markdown prose) with this shape:",
    '{"summary":"2-3 sentences","topics":[{"question":"...","classification":"faq_gap|handoff|chitchat|resolved","confidence":0.0-1.0,"suggestedFaq":"optional FAQ answer draft for faq_gap only"}]}',
    "Rules:",
    "- faq_gap: visitor asked a real business question the bot could not answer from knowledge",
    "- handoff: visitor wanted a human, not FAQ content",
    "- chitchat: greetings, thanks, small talk, acknowledgments",
    "- resolved: bot answered satisfactorily from knowledge",
    "- One topic per distinct visitor question worth admin attention",
    "",
    "Transcript:",
    transcript,
  ].join("\n");

  const raw = await chat.chat(
    [
      { role: "system", content: "You classify chat topics for a support dashboard." },
      { role: "user", content: prompt },
    ],
    { temperature: 0.1, maxTokens: 1200 },
  );

  const reviewMeta = parseReviewJson(raw);
  if (!reviewMeta) {
    throw new Error("Session review returned invalid JSON");
  }

  session.memorySummary = reviewMeta.summary;
  session.reviewMeta = reviewMeta;
  await session.save();

  await prisma.usageEvent.create({
    data: {
      projectId: opts.projectId,
      kind: "session_review",
      units: 1,
      meta: { sessionId: opts.sessionId, topicCount: reviewMeta.topics.length },
    },
  });

  return { skipped: false };
}
