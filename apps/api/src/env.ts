import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");
config({ path: resolve(root, ".env") });
config({ path: resolve(root, ".env.local") });

export const env = {
  port: Number(process.env.PORT ?? process.env.API_PORT ?? 3100),
  host: process.env.API_HOST ?? "0.0.0.0",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  cookieSecure: process.env.COOKIE_SECURE === "true",
  cookieSameSite: (process.env.COOKIE_SAME_SITE ?? "lax") as "lax" | "strict" | "none",
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  rateLimitMaxIp: Number(process.env.RATE_LIMIT_MAX_IP ?? 60),
  rateLimitMaxClient: Number(process.env.RATE_LIMIT_MAX_CLIENT ?? 120),
  publicApiUrl: process.env.PUBLIC_API_URL ?? "http://localhost:3100",
  webAppUrl: process.env.WEB_APP_URL ?? "http://localhost:3000",
  encryptionKey: process.env.ENCRYPTION_KEY ?? "",
};
