import type { FastifyReply, FastifyRequest } from "fastify";
import { subscribeChannel } from "./realtime.js";

/** Proxies and load balancers drop idle connections at roughly 30-60s. */
const HEARTBEAT_MS = 25_000;

/**
 * Opens an SSE response bridged to one or more Redis channels.
 *
 * Resolves only once the client disconnects, so the route handler stays alive for
 * the life of the stream. Heartbeats and teardown live here rather than at each
 * call site: a missed heartbeat kills the stream silently, and a missed
 * unsubscribe leaks a listener on every reconnect.
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

  let open = true;
  const write = (payload: unknown) => {
    if (!open) return;
    try {
      reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch {
      open = false;
    }
  };

  if (initialEvent) write(initialEvent);

  const unsubscribes = await Promise.all(
    channels.map((channel) => subscribeChannel(channel, write)),
  );

  const heartbeat = setInterval(() => {
    if (!open) return;
    try {
      reply.raw.write(`: ping\n\n`);
    } catch {
      open = false;
    }
  }, HEARTBEAT_MS);

  await new Promise<void>((resolve) => {
    const close = () => {
      if (!open) return;
      open = false;
      clearInterval(heartbeat);
      for (const unsubscribe of unsubscribes) unsubscribe();
      resolve();
    };
    req.raw.on("close", close);
    req.raw.on("error", close);
    reply.raw.on("close", close);
  });
}
