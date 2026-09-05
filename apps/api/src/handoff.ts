import type { ChatSessionModel } from "@quickstart-ai/db";
import { publishInboxEvent, publishSessionEvent } from "./realtime.js";
import { buildAuditMessage, resolveAgentUsers } from "./session-audit.js";

/** Without a timeout, a visitor who escalates when nobody is on shift is left with a widget that never replies again. */
const DEFAULT_HANDOFF_TIMEOUT_MS = 10 * 60 * 1000;

/** `??` alone lets "" through as 0 (everything instantly stale) and junk through as NaN (nothing ever stale). Both fail silently. */
function resolveTimeoutMs(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!raw?.trim() || !Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_HANDOFF_TIMEOUT_MS;
  }
  return parsed;
}

export const HANDOFF_TIMEOUT_MS = resolveTimeoutMs(process.env.HANDOFF_TIMEOUT_MS);

interface HandoffState {
  humanPending?: boolean | null;
  humanActive?: boolean | null;
  escalatedAt?: Date | null;
  takenOverAt?: Date | null;
  agentLastActiveAt?: Date | null;
}

/** Active handoffs age from the agent's last write, unclaimed ones from the escalation. */
export function isHandoffStale(session: HandoffState, now = Date.now()): boolean {
  if (session.humanActive) {
    const last = session.agentLastActiveAt ?? session.takenOverAt;
    return !last || now - last.getTime() > HANDOFF_TIMEOUT_MS;
  }
  if (session.humanPending) {
    const since = session.escalatedAt;
    return !since || now - since.getTime() > HANDOFF_TIMEOUT_MS;
  }
  return false;
}

/**
 * Hands a timed-out conversation back to the bot while keeping it in the queue.
 *
 * humanPending stays set on purpose: "somebody asked for a person and nobody came"
 * is what the business needs to see, and clearing it would erase an overnight
 * escalation before anyone read it.
 */
export async function releaseStaleHandoff(
  Session: ChatSessionModel,
  sessionId: string,
  projectId: string,
): Promise<void> {
  const session = await Session.findById(sessionId);
  if (!session) return;

  const agents = session.agentId ? await resolveAgentUsers([session.agentId]) : new Map();
  const agent = session.agentId ? agents.get(session.agentId) ?? null : null;

  await Session.updateOne(
    { _id: sessionId },
    {
      $set: { humanActive: false, humanPending: true, releasedAt: new Date() },
      $unset: { agentId: "" },
      $push: {
        messages: buildAuditMessage("handoff_expired", { agent }),
      },
    },
  );
  await publishSessionEvent(sessionId, { type: "human_released" });
  await publishInboxEvent(projectId, { type: "session_released", sessionId });
}
