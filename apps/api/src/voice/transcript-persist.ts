import { connectMongo, getChatSessionModel, prisma, type ChatMessageDoc, type ChatSessionDoc } from "@quickstart-ai/db";
import { collectAndEmitChatEvents } from "@quickstart-ai/events";
import { NotFoundError } from "@quickstart-ai/shared";
import { env } from "../env.js";
import { publishInboxEvent } from "../realtime.js";

export type VoiceTranscriptTurn = {
  role: "user" | "assistant";
  content: string;
  clientTurnId?: string;
  voiceSessionId?: string;
};

function messageMeta(m: ChatMessageDoc): Record<string, unknown> {
  return (m.meta ?? {}) as Record<string, unknown>;
}

export function isDuplicateVoiceTurn(
  messages: ChatMessageDoc[],
  turn: VoiceTranscriptTurn,
): boolean {
  const content = turn.content.trim();
  const recent = messages.slice(-20);
  for (const msg of recent) {
    const meta = messageMeta(msg);
    if (turn.clientTurnId && meta.clientTurnId === turn.clientTurnId) {
      return true;
    }
    if (msg.role === turn.role && String(msg.content ?? "").trim() === content) {
      return true;
    }
  }
  return false;
}

function isDuplicateTurn(session: ChatSessionDoc, turn: VoiceTranscriptTurn): boolean {
  return isDuplicateVoiceTurn(session.messages ?? [], turn);
}

async function emitVoiceComplianceEvents(
  session: ChatSessionDoc,
  savedTurns: VoiceTranscriptTurn[],
  hadUserBefore: boolean,
): Promise<void> {
  if (!savedTurns.length) return;

  let seenUser = hadUserBefore;
  let pendingUser: string | null = null;

  for (const turn of savedTurns) {
    const content = turn.content.trim();
    if (!content) continue;

    if (turn.role === "user") {
      pendingUser = content;
      const isFirstUserMessage = !seenUser;
      seenUser = true;
      void collectAndEmitChatEvents({
        projectId: session.projectId,
        sessionId: String(session._id),
        visitor: { name: session.visitorName, email: session.visitorEmail },
        userMessage: content,
        assistantAnswer: "",
        confidence: "medium",
        toolsUsed: [],
        chunkCount: 0,
        topScore: 0,
        isFirstUserMessage,
        agentEvents: [],
        redisUrl: env.redisUrl,
        webAppUrl: env.webAppUrl,
      }).catch(() => {});
    } else if (turn.role === "assistant") {
      void collectAndEmitChatEvents({
        projectId: session.projectId,
        sessionId: String(session._id),
        visitor: { name: session.visitorName, email: session.visitorEmail },
        userMessage: pendingUser ?? "",
        assistantAnswer: content,
        confidence: "medium",
        toolsUsed: [],
        chunkCount: 0,
        topScore: 0,
        isFirstUserMessage: false,
        agentEvents: [],
        redisUrl: env.redisUrl,
        webAppUrl: env.webAppUrl,
      }).catch(() => {});
      pendingUser = null;
    }
  }
}

export async function persistVoiceTranscriptTurns(opts: {
  projectId: string;
  chatSessionId: string;
  turns: VoiceTranscriptTurn[];
}): Promise<{ saved: number }> {
  await connectMongo();
  const Session = getChatSessionModel();
  const session = await Session.findById(opts.chatSessionId);
  if (!session || session.projectId !== opts.projectId) {
    throw new NotFoundError("Session not found");
  }

  const hadUserBefore = (session.messages ?? []).some((m) => m.role === "user");
  const savedTurns: VoiceTranscriptTurn[] = [];
  const at = new Date().toISOString();

  for (const turn of opts.turns) {
    const content = turn.content.trim();
    if (!content) continue;
    if (isDuplicateTurn(session, turn)) continue;

    session.messages.push({
      role: turn.role,
      content,
      meta: {
        source: "voice",
        voiceSessionId: turn.voiceSessionId ?? null,
        clientTurnId: turn.clientTurnId ?? null,
      },
    });
    savedTurns.push(turn);

    if (turn.role === "user") {
      void publishInboxEvent(session.projectId, {
        type: "visitor_message",
        sessionId: opts.chatSessionId,
        content,
        at,
      });
    }
  }

  if (!savedTurns.length) {
    return { saved: 0 };
  }

  await session.save();

  await Promise.all(
    savedTurns.map(() =>
      prisma.usageEvent.create({
        data: {
          projectId: session.projectId,
          kind: "chat_message",
          units: 1,
          meta: { source: "voice" },
        },
      }),
    ),
  );

  await emitVoiceComplianceEvents(session, savedTurns, hadUserBefore);

  return { saved: savedTurns.length };
}
