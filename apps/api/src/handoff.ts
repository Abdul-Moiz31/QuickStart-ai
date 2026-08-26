import type { ChatSessionModel } from "@quickstart-ai/db";
import { publishInboxEvent, publishSessionEvent } from "./realtime.js";

/**
 * How long a handoff may sit untouched before the bot takes the conversation back.
 *
 * Without this, a visitor who escalates when nobody is on shift gets a widget that
 * never replies again — strictly worse than the bot answering imperfectly.
 */
export const HANDOFF_TIMEOUT_MS = Number(process.env.HANDOFF_TIMEOUT_MS ?? 10 * 60 * 1000);

interface HandoffState {
  humanPending?: boolean | null;
  humanActive?: boolean | null;
  escalatedAt?: Date | null;
  takenOverAt?: Date | null;
  agentLastActiveAt?: Date | null;
}

/**
 * An active handoff goes stale from the agent's last write; an unclaimed one from
 * the moment it was escalated.
 */
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
 * Clears a stale handoff and tells both sides.
 *
 * Released on read rather than by a scheduled sweep. The only observable effects of
 * staleness are that the bot stays silent for the visitor and that the inbox shows a
 * row nobody is working, and both are resolved at the moment someone would notice —
 * the visitor's next message, or the inbox being opened. A sweep would need Mongo in
 * the worker to fix nothing sooner that anyone can see.
 */
export async function releaseStaleHandoff(
  Session: ChatSessionModel,
  sessionId: string,
  projectId: string,
): Promise<void> {
  await Session.updateOne(
    { _id: sessionId },
    {
      $set: { humanActive: false, humanPending: false, releasedAt: new Date() },
      $unset: { agentId: "" },
    },
  );
  await publishSessionEvent(sessionId, { type: "human_released" });
  await publishInboxEvent(projectId, { type: "session_released", sessionId });
}
