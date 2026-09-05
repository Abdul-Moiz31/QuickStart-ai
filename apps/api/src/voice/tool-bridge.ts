import { connectMongo, getChatSessionModel, isValidSessionId, prisma } from "@quickstart-ai/db";
import { collectAndEmitChatEvents } from "@quickstart-ai/events";
import {
  createChatClient,
  createEmbeddingsClient,
  hybridRetrieve,
  rerankChunks,
} from "@quickstart-ai/rag";
import { BUILTIN_EVENT_TYPES, NotFoundError } from "@quickstart-ai/shared";
import { env } from "../env.js";
import { getProjectChatRuntime, getProjectEmbeddingsRuntime } from "../project-llm.js";
import { publishInboxEvent } from "../realtime.js";
import { appendAuditMessage } from "../session-audit.js";
import { buildGeminiToolDeclarations, type VoiceProjectConfig } from "./instructions.js";
import { getVoiceSession } from "./session-store.js";

const TOOL_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

async function searchKnowledge(projectId: string, args: Record<string, unknown>): Promise<string> {
  const query = String(args.query ?? "").trim();
  if (!query) return "No query provided.";

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return "Project not found.";

  const embeddings = createEmbeddingsClient(getProjectEmbeddingsRuntime(project));
  const chat = createChatClient(getProjectChatRuntime(project));

  const work = async (): Promise<string> => {
    const { chunks } = await hybridRetrieve({
      projectId,
      query,
      embeddings,
      chat,
      useHyde: false,
      topK: 12,
    });
    const reranked = await rerankChunks(query, chunks, chat, 5);
    if (!reranked.length) return "No knowledge snippets found.";
    return reranked.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n");
  };

  return withTimeout(
    work(),
    TOOL_TIMEOUT_MS,
    "Knowledge search timed out. Answer from general conversation only.",
  );
}

async function escalateVoice(opts: {
  projectId: string;
  chatSessionId?: string | null;
  args: Record<string, unknown>;
}): Promise<string> {
  const reason = String(opts.args.reason ?? "customer requested human help");
  if (!opts.chatSessionId || !isValidSessionId(opts.chatSessionId)) {
    return `Escalation noted (${reason}). Ask the visitor to type in chat to connect with support.`;
  }

  await connectMongo();
  const Session = getChatSessionModel();
  const session = await Session.findById(opts.chatSessionId);
  if (!session || session.projectId !== opts.projectId) {
    return `Escalation noted (${reason}).`;
  }
  if (!session.humanActive && !session.humanPending) {
    const now = new Date();
    session.humanPending = true;
    session.escalatedAt = now;
    appendAuditMessage(session, "handoff_requested", { detail: reason });
    await session.save();
    void publishInboxEvent(opts.projectId, {
      type: "escalation",
      sessionId: opts.chatSessionId,
      visitorName: session.visitorName,
      message: reason,
      at: now.toISOString(),
    });
  }
  return `Escalation flagged: ${reason}. A human agent will follow up in chat.`;
}

async function captureLeadVoice(opts: {
  projectId: string;
  chatSessionId?: string | null;
  args: Record<string, unknown>;
}): Promise<string> {
  const name = String(opts.args.name ?? "unknown");
  const email = String(opts.args.email ?? "unknown");
  const phone = opts.args.phone ? String(opts.args.phone) : undefined;
  const note = opts.args.note ? String(opts.args.note) : undefined;

  let visitorName = name;
  let visitorEmail = email;
  if (opts.chatSessionId && isValidSessionId(opts.chatSessionId)) {
    await connectMongo();
    const Session = getChatSessionModel();
    const session = await Session.findById(opts.chatSessionId).select("visitorName visitorEmail");
    if (session) {
      visitorName = session.visitorName ?? name;
      visitorEmail = session.visitorEmail ?? email;
    }
  }

  if (opts.chatSessionId && isValidSessionId(opts.chatSessionId)) {
    void collectAndEmitChatEvents({
      projectId: opts.projectId,
      sessionId: opts.chatSessionId,
      visitor: { name: visitorName, email: visitorEmail },
      userMessage: note ?? "Voice lead capture",
      assistantAnswer: `Lead captured: ${name} <${email}>`,
      confidence: "high",
      toolsUsed: ["capture_lead"],
      chunkCount: 0,
      topScore: 0,
      isFirstUserMessage: false,
      agentEvents: [
        {
          type: BUILTIN_EVENT_TYPES.LEAD_CAPTURED,
          source: "tool",
          sessionId: opts.chatSessionId,
          payload: { name, email, phone, note, visitor: { name, email } },
        },
      ],
      redisUrl: env.redisUrl,
      webAppUrl: env.webAppUrl,
    }).catch(() => {});
  }

  return `Lead captured for ${name} <${email}>`;
}

export async function executeVoiceToolCall(opts: {
  projectId: string;
  voiceSessionId: string;
  toolName: string;
  toolCallId: string;
  args: Record<string, unknown>;
}): Promise<{ output: unknown; actions?: { stopVoice?: boolean; humanPending?: boolean } }> {
  const state = await getVoiceSession(opts.voiceSessionId);
  if (!state || state.projectId !== opts.projectId) {
    throw new NotFoundError("Voice session not found");
  }

  const project = await prisma.project.findUnique({ where: { id: opts.projectId } });
  if (!project) throw new NotFoundError("Project not found");

  const allowed = buildGeminiToolDeclarations(project as VoiceProjectConfig).map((t) => t.name);
  if (!allowed.includes(opts.toolName)) {
    return { output: { error: `Tool ${opts.toolName} is not enabled for this project.` } };
  }

  switch (opts.toolName) {
    case "search_knowledge":
      return { output: await searchKnowledge(opts.projectId, opts.args) };
    case "escalate_to_human": {
      const output = await escalateVoice({
        projectId: opts.projectId,
        chatSessionId: state.chatSessionId,
        args: opts.args,
      });
      return { output, actions: { stopVoice: true, humanPending: true } };
    }
    case "capture_lead":
      return {
        output: await captureLeadVoice({
          projectId: opts.projectId,
          chatSessionId: state.chatSessionId,
          args: opts.args,
        }),
      };
    default:
      return { output: { error: `Unknown tool: ${opts.toolName}` } };
  }
}
