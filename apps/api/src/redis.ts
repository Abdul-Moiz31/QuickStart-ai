import { Redis } from "ioredis";
import { env } from "./env.js";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });
  }
  return redis;
}

export async function assertRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const r = getRedis();
  if (r.status !== "ready") {
    try {
      await r.connect();
    } catch {
      // fail open in local if redis down
      return { allowed: true, remaining: limit };
    }
  }
  const bucket = `rl:${key}`;
  const count = await r.incr(bucket);
  if (count === 1) await r.pexpire(bucket, windowMs);
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}
