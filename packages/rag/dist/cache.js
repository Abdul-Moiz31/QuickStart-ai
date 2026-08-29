import { createHash } from "node:crypto";
export function normalizeQuery(q) {
    return q.toLowerCase().replace(/\s+/g, " ").trim();
}
export function cacheKey(projectId, query) {
    const hash = createHash("sha256").update(normalizeQuery(query)).digest("hex").slice(0, 24);
    return `chatcache:${projectId}:${hash}`;
}
export async function getCachedAnswer(redis, projectId, query) {
    return redis.get(cacheKey(projectId, query));
}
export async function setCachedAnswer(redis, projectId, query, answer, ttlSeconds = Number(process.env.CHAT_CACHE_TTL_SECONDS ?? 300)) {
    await redis.set(cacheKey(projectId, query), answer, "EX", ttlSeconds);
}
export async function getSessionMemory(redis, sessionId) {
    return redis.lrange(`memory:${sessionId}`, 0, 19);
}
export async function pushSessionMemory(redis, sessionId, turn) {
    const key = `memory:${sessionId}`;
    await redis.lpush(key, turn);
    await redis.ltrim(key, 0, 19);
    await redis.expire(key, 60 * 60 * 24);
}
//# sourceMappingURL=cache.js.map