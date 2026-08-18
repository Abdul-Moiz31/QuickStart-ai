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
      if (process.env.NODE_ENV === "production") {
        // Fail CLOSED in production — a Redis outage must not open the flood gates
        return { allowed: false, remaining: 0 };
      }
      // Fail open in dev/test so a missing Redis doesn't block local work
      return { allowed: true, remaining: limit };
    }
  }
  const bucket = `rl:${key}`;
  const count = await r.incr(bucket);
  if (count === 1) await r.pexpire(bucket, windowMs);
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}
