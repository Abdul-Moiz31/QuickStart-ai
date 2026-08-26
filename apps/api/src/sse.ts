import type { FastifyReply, FastifyRequest } from "fastify";
import { subscribeChannel } from "./realtime.js";

/** Proxies and load balancers drop idle connections at roughly 30-60s. */
const HEARTBEAT_MS = 25_000;

/**
 * Opens an SSE response bridged to one or more Redis channels.
 * Resolves once the client disconnects, keeping the route handler alive for the
 * life of the stream.
 */
export async function streamChannels(opts: {
  req: FastifyRequest;
  reply: FastifyReply;
  channels: string[];
  /** Sent once, immediately, so a reconnecting client can reconcile before any live event. */
  initialEvent?: unknown;
}): Promise<void> {
  const { req, reply, channels, initialEvent } = opts;

  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  // Tracked separately: a failed write means the socket is gone, which is not the
  // same as teardown having run. Conflating them lets a write error skip cleanup.
  let writable = true;
  let closed = false;
  let unsubscribes: (() => void)[] = [];
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let onClosed: (() => void) | null = null;

  const teardown = () => {
    if (closed) return;
    closed = true;
    writable = false;
    if (heartbeat) clearInterval(heartbeat);
    for (const unsubscribe of unsubscribes) unsubscribe();
    unsubscribes = [];
    onClosed?.();
  };

  // Attached before any await. Subscribing touches Redis, and a client that
  // disconnects during that window would otherwise never be observed, leaking the
  // heartbeat and holding the channel subscription open for the process lifetime.
  req.raw.on("close", teardown);
  req.raw.on("error", teardown);
  reply.raw.on("close", teardown);

  const write = (payload: unknown) => {
    if (!writable) return;
    try {
      reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch {
      teardown();
    }
  };

  if (initialEvent) write(initialEvent);

  const handles = await Promise.all(
    channels.map((channel) => subscribeChannel(channel, write)),
  );

  // The client may have gone while we were subscribing; teardown has already run,
  // so release these directly rather than storing them.
  if (closed) {
    for (const unsubscribe of handles) unsubscribe();
    return;
  }
  unsubscribes = handles;

  heartbeat = setInterval(() => {
    if (!writable) return;
    try {
      reply.raw.write(`: ping\n\n`);
    } catch {
      teardown();
    }
  }, HEARTBEAT_MS);

  await new Promise<void>((resolve) => {
    if (closed) {
      resolve();
      return;
    }
    onClosed = resolve;
  });
}
