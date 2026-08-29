import { createHash } from "node:crypto";
import { prisma } from "@quickstart-ai/db";
import { EVENT_LIMITS, QUEUE_NAMES, resolveEventMeta } from "@quickstart-ai/shared";
import { Queue } from "bullmq";
let eventsQueue = null;
export function getEventsQueue(redisUrl) {
    if (!eventsQueue) {
        eventsQueue = new Queue(QUEUE_NAMES.EVENTS, {
            connection: { url: redisUrl },
            defaultJobOptions: {
                removeOnComplete: 1000,
                removeOnFail: 5000,
            },
        });
    }
    return eventsQueue;
}
function buildIdempotencyKey(projectId, type, sessionId, payload) {
    const raw = `${projectId}:${type}:${sessionId ?? ""}:${JSON.stringify(payload)}`;
    return createHash("sha256").update(raw).digest("hex");
}
async function checkRateLimit(projectId, redisUrl) {
    try {
        const { default: Redis } = await import("ioredis");
        const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, lazyConnect: true });
        await redis.connect();
        const key = `events:rate:${projectId}`;
        const count = await redis.incr(key);
        if (count === 1)
            await redis.expire(key, 60);
        await redis.quit();
        return count <= EVENT_LIMITS.eventsPerMinute;
    }
    catch {
        return true;
    }
}
export async function persistAndEnqueueEvents(opts) {
    if (!opts.events.length)
        return [];
    const allowed = await checkRateLimit(opts.projectId, opts.redisUrl);
    if (!allowed)
        return [];
    const queue = getEventsQueue(opts.redisUrl);
    const createdIds = [];
    const slice = opts.events.slice(0, EVENT_LIMITS.eventsPerMessage);
    for (const ev of slice) {
        const meta = resolveEventMeta(ev.type, {
            name: ev.name,
            description: ev.description,
        });
        const idempotencyKey = ev.idempotencyKey ??
            buildIdempotencyKey(opts.projectId, ev.type, ev.sessionId, ev.payload);
        try {
            const row = await prisma.projectEvent.create({
                data: {
                    projectId: opts.projectId,
                    type: ev.type,
                    name: meta.name,
                    description: meta.description,
                    source: ev.source,
                    sessionId: ev.sessionId,
                    idempotencyKey,
                    payload: JSON.parse(JSON.stringify(ev.payload)),
                },
            });
            createdIds.push(row.id);
            await queue.add("deliver-event", { eventId: row.id, projectId: opts.projectId }, { jobId: row.id });
        }
        catch (err) {
            if (err instanceof Error && /Unique constraint/i.test(err.message))
                continue;
            throw err;
        }
    }
    return createdIds;
}
//# sourceMappingURL=emit.js.map