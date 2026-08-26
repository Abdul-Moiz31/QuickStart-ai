import { Redis } from "ioredis";
import { env } from "./env.js";
import { getRedis } from "./redis.js";

/**
 * Live-conversation transport for the human agent inbox.
 *
 * The agent's reply and the visitor's open connection do not necessarily land on the
 * same API process, so the two sides are bridged over Redis. An in-process emitter
 * would work on one instance and fail silently once the API scales.
 */

/** Per-session channel. A widget on a project-wide channel would see other visitors' messages. */
export function sessionChannel(sessionId: string): string {
  return `qs:session:${sessionId}`;
}

/** Per-project channel for inbox-level notices. */
export function inboxChannel(projectId: string): string {
  return `qs:project:${projectId}:inbox`;
}

export type SessionEvent =
  | { type: "agent_message"; content: string; at: string }
  | { type: "human_active"; agentName?: string }
  | { type: "human_released" }
  | { type: "agent_typing" };

export type InboxEvent =
  | { type: "escalation"; sessionId: string; visitorName: string; message?: string; at: string }
  | { type: "visitor_message"; sessionId: string; content: string; at: string }
  | { type: "visitor_typing"; sessionId: string }
  | { type: "session_taken"; sessionId: string; agentId: string }
  | { type: "session_released"; sessionId: string };

/**
 * Subscribers get their own connection: a subscribed ioredis client cannot run
 * ordinary commands, so sharing getRedis() would break every rate-limit check in the
 * API the moment the first stream opened.
 */
let subscriber: Redis | null = null;

export function getSubscriber(): Redis {
  if (!subscriber) {
    subscriber = new Redis(env.redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });
  }
  return subscriber;
}

/** Best-effort by design: callers persist to Mongo first, so an outage costs delivery, never the message. */
async function publish(channel: string, payload: unknown): Promise<void> {
  try {
    const redis = getRedis();
    if (redis.status !== "ready") await redis.connect();
    await redis.publish(channel, JSON.stringify(payload));
  } catch {
    // Live delivery is best-effort; the widget reconciles from Mongo on reconnect.
  }
}

export async function publishSessionEvent(sessionId: string, event: SessionEvent): Promise<void> {
  await publish(sessionChannel(sessionId), event);
}

export async function publishInboxEvent(projectId: string, event: InboxEvent): Promise<void> {
  await publish(inboxChannel(projectId), event);
}

/**
 * One subscriber connection serves every stream, so subscriptions are reference
 * counted per channel. Without the count, the first tab to close would silently
 * deafen every other tab on the same channel.
 */
type ChannelListener = (payload: unknown) => void;

const listeners = new Map<string, Set<ChannelListener>>();
let messageHandlerBound = false;

function bindMessageHandler(): void {
  if (messageHandlerBound) return;
  messageHandlerBound = true;
  getSubscriber().on("message", (channel: string, raw: string) => {
    const subs = listeners.get(channel);
    if (!subs?.size) return;
    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }
    for (const listener of subs) listener(payload);
  });
}

/** Subscribe to a channel. Returns an unsubscribe function; always call it on disconnect. */
export async function subscribeChannel(
  channel: string,
  listener: ChannelListener,
): Promise<() => void> {
  const sub = getSubscriber();
  if (sub.status !== "ready" && sub.status !== "connecting") {
    try {
      await sub.connect();
    } catch {
      // Fall through: the listener is still registered so a later reconnect delivers.
    }
  }
  bindMessageHandler();

  let set = listeners.get(channel);
  if (!set) {
    // Registered only once SUBSCRIBE succeeds. Recording the channel first would
    // make every later subscriber short-circuit on an entry that is not actually
    // subscribed, leaving the channel silently dead for the process lifetime even
    // after Redis recovers.
    try {
      await sub.subscribe(channel);
    } catch {
      // Leave the channel unregistered so the next subscriber retries.
      return () => {};
    }
    set = new Set();
    listeners.set(channel, set);
  }
  set.add(listener);

  let released = false;
  return () => {
    if (released) return;
    released = true;
    const current = listeners.get(channel);
    if (!current) return;
    current.delete(listener);
    if (current.size === 0) {
      listeners.delete(channel);
      void sub.unsubscribe(channel).catch(() => undefined);
    }
  };
}
