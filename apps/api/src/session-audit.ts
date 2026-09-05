import type { ChatMessageDoc, ChatSessionDoc } from "@quickstart-ai/db";
import { prisma } from "@quickstart-ai/db";

export type SessionAuditType =
  | "handoff_requested"
  | "agent_joined"
  | "agent_released"
  | "handoff_expired";

export type AgentUser = { id: string; name: string; email: string };

export type SessionAuditEvent = {
  type: SessionAuditType;
  at: string;
  agentId?: string | null;
  agentName?: string | null;
  detail?: string | null;
};

const AUDIT_LABELS: Record<SessionAuditType, string> = {
  handoff_requested: "Handoff requested",
  agent_joined: "Agent joined",
  agent_released: "Agent left — bot resumed",
  handoff_expired: "Handoff timed out — bot resumed",
};

export async function resolveAgentUsers(agentIds: string[]): Promise<Map<string, AgentUser>> {
  const unique = [...new Set(agentIds.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const users = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true, email: true },
  });

  return new Map(users.map((u) => [u.id, u]));
}

function displayAgentName(agent?: AgentUser | null): string {
  if (!agent) return "Support agent";
  return agent.name?.trim() || agent.email;
}

type SessionAuditMessage = {
  role: "system";
  content: string;
  meta: {
    auditType: SessionAuditType;
    agentId: string | null;
    agentName: string | null;
    detail: string | null;
  };
  createdAt?: Date;
};

export function buildAuditMessage(
  type: SessionAuditType,
  opts: { agent?: AgentUser | null; detail?: string | null } = {},
): SessionAuditMessage {
  const agentName = opts.agent ? displayAgentName(opts.agent) : null;
  let content = AUDIT_LABELS[type];
  if (type === "agent_joined" && agentName) {
    content = `${agentName} joined the conversation`;
  } else if (type === "agent_released" && agentName) {
    content = `${agentName} left — bot resumed`;
  } else if (type === "handoff_requested" && opts.detail?.trim()) {
    content = `Handoff requested: ${opts.detail.trim()}`;
  }

  return {
    role: "system",
    content,
    meta: {
      auditType: type,
      agentId: opts.agent?.id ?? null,
      agentName,
      detail: opts.detail ?? null,
    },
  };
}

export function appendAuditMessage(
  session: { messages?: Array<ChatMessageDoc | SessionAuditMessage> },
  type: SessionAuditType,
  opts: { agent?: AgentUser | null; detail?: string | null } = {},
): void {
  if (!session.messages) session.messages = [];
  session.messages.push(buildAuditMessage(type, opts));
}

function messageAuditType(message: Pick<ChatMessageDoc, "meta">): SessionAuditType | null {
  const meta = (message.meta ?? {}) as { auditType?: SessionAuditType };
  return meta.auditType ?? null;
}

function messageAgentId(message: Pick<ChatMessageDoc, "meta">): string | null {
  const meta = (message.meta ?? {}) as { agentId?: string | null };
  return meta.agentId ?? null;
}

function messageAgentName(message: Pick<ChatMessageDoc, "meta">): string | null {
  const meta = (message.meta ?? {}) as { agentName?: string | null };
  return meta.agentName ?? null;
}

/** Build a chronological audit timeline from persisted system messages and session timestamps. */
export function buildSessionAuditTimeline(
  session: {
    messages?: Array<{
      role?: string;
      content?: string;
      meta?: unknown;
      createdAt?: Date;
    }>;
    escalatedAt?: Date | null;
    takenOverAt?: Date | null;
    releasedAt?: Date | null;
    agentId?: string | null;
  },
  agents: Map<string, AgentUser>,
): SessionAuditEvent[] {
  const events: SessionAuditEvent[] = [];
  const seen = new Set<string>();

  const pushEvent = (event: SessionAuditEvent) => {
    const key = `${event.type}:${event.at}:${event.agentId ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    events.push(event);
  };

  for (const message of session.messages ?? []) {
    if (message.role !== "system") continue;
    const type = messageAuditType({ meta: message.meta });
    if (!type) continue;
    const agentId = messageAgentId({ meta: message.meta });
    const agent = agentId ? agents.get(agentId) ?? null : null;
    pushEvent({
      type,
      at: message.createdAt?.toISOString?.() ?? new Date().toISOString(),
      agentId,
      agentName: messageAgentName({ meta: message.meta }) ?? (agent ? displayAgentName(agent) : null),
      detail: ((message.meta ?? {}) as { detail?: string | null }).detail ?? null,
    });
  }

  if (session.escalatedAt && !events.some((e) => e.type === "handoff_requested")) {
    pushEvent({
      type: "handoff_requested",
      at: session.escalatedAt.toISOString(),
      agentId: null,
      agentName: null,
      detail: null,
    });
  }

  if (session.takenOverAt && !events.some((e) => e.type === "agent_joined")) {
    const agent = session.agentId ? agents.get(session.agentId) ?? null : null;
    pushEvent({
      type: "agent_joined",
      at: session.takenOverAt.toISOString(),
      agentId: session.agentId ?? null,
      agentName: agent ? displayAgentName(agent) : null,
      detail: null,
    });
  }

  if (session.releasedAt && !events.some((e) => e.type === "agent_released")) {
    const agent = session.agentId ? agents.get(session.agentId) ?? null : null;
    pushEvent({
      type: "agent_released",
      at: session.releasedAt.toISOString(),
      agentId: session.agentId ?? null,
      agentName: agent ? displayAgentName(agent) : null,
      detail: null,
    });
  }

  return events.sort((a, b) => a.at.localeCompare(b.at));
}

export function collectAgentIdsFromSession(session: {
  agentId?: string | null;
  messages?: Array<Pick<ChatMessageDoc, "role" | "meta">>;
}): string[] {
  const ids = new Set<string>();
  if (session.agentId) ids.add(session.agentId);
  for (const message of session.messages ?? []) {
    const agentId = messageAgentId(message);
    if (agentId) ids.add(agentId);
    if (message.role === "agent") {
      const metaAgentId = ((message.meta ?? {}) as { agentId?: string }).agentId;
      if (metaAgentId) ids.add(metaAgentId);
    }
  }
  return [...ids];
}

export function resolveMessageAgentName(
  message: Pick<ChatMessageDoc, "role" | "meta">,
  agents: Map<string, AgentUser>,
): string | null {
  const fromMeta = messageAgentName(message);
  if (fromMeta) return fromMeta;
  const agentId =
    messageAgentId(message) ??
    ((message.meta ?? {}) as { agentId?: string }).agentId ??
    null;
  if (!agentId) return null;
  const agent = agents.get(agentId);
  return agent ? displayAgentName(agent) : null;
}

export { displayAgentName, AUDIT_LABELS };
