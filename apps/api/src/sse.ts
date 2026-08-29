import type { FastifyReply, FastifyRequest } from "fastify";
import { subscribeChannel } from "./realtime.js";
import { env } from "./env.js";

/** Match @fastify/cors allowlist (plus localhost in dev). */
export function resolveCorsOrigin(req: FastifyRequest): string | undefined {
  const origin = req.headers.origin;
  if (typeof origin !== "string" || !origin) return undefined;
  if (env.corsOrigins.includes(origin)) return origin;
  if (
    process.env.NODE_ENV !== "production" &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  ) {
    return origin;
  }
  return undefined;
}

function sseHeaders(req: FastifyRequest): Record<string, string | number> {
  const origin = resolveCorsOrigin(req);
  const headers: Record<string, string | number> = {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
    headers.Vary = "Origin";
  }
  return headers;
}

/** Hijack the reply and write SSE headers including CORS (required when using reply.raw). */
export function beginSseReply(req: FastifyRequest, reply: FastifyReply): void {
  reply.hijack();
  reply.raw.writeHead(200, sseHeaders(req));
}

export function writeSseEvent(
  reply: FastifyReply,
  event: Record<string, unknown>,
): void {
  reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
}

export function endSse(reply: FastifyReply): void {
  reply.raw.end();
}

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

  reply.hijack();
  reply.raw.writeHead(200, sseHeaders(req));

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
