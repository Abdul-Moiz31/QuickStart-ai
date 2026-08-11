import type { Redis } from "ioredis";
import { createHash } from "node:crypto";

export function normalizeQuery(q: string): string {
  return q.toLowerCase().replace(/\s+/g, " ").trim();
}

export function cacheKey(projectId: string, query: string): string {
  const hash = createHash("sha256").update(normalizeQuery(query)).digest("hex").slice(0, 24);
  return `chatcache:${projectId}:${hash}`;
}

export async function getCachedAnswer(
  redis: Redis,
  projectId: string,
  query: string,
): Promise<string | null> {
  return redis.get(cacheKey(projectId, query));
}

export async function setCachedAnswer(
  redis: Redis,
  projectId: string,
  query: string,
  answer: string,
  ttlSeconds = Number(process.env.CHAT_CACHE_TTL_SECONDS ?? 300),
): Promise<void> {
  await redis.set(cacheKey(projectId, query), answer, "EX", ttlSeconds);
}

export async function getSessionMemory(
  redis: Redis,
  sessionId: string,
): Promise<string[]> {
  return redis.lrange(`memory:${sessionId}`, 0, 19);
}

export async function pushSessionMemory(
  redis: Redis,
  sessionId: string,
  turn: string,
): Promise<void> {
  const key = `memory:${sessionId}`;
  await redis.lpush(key, turn);
  await redis.ltrim(key, 0, 19);
  await redis.expire(key, 60 * 60 * 24);
}
