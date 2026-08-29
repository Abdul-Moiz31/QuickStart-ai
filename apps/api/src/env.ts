import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");
config({ path: resolve(root, ".env") });
config({ path: resolve(root, ".env.local") });

const DEV_JWT_DEFAULT = "dev-secret-change-me";

export const env = {
  port: Number(process.env.PORT ?? process.env.API_PORT ?? 3100),
  host: process.env.API_HOST ?? "0.0.0.0",
  jwtSecret: process.env.JWT_SECRET ?? DEV_JWT_DEFAULT,
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
  rateLimitMaxAuthIp: Number(process.env.RATE_LIMIT_MAX_AUTH_IP ?? 10),
  rateLimitMaxAuthEmail: Number(process.env.RATE_LIMIT_MAX_AUTH_EMAIL ?? 5),
  publicApiUrl: process.env.PUBLIC_API_URL ?? "http://localhost:3100",
  webAppUrl: process.env.WEB_APP_URL ?? "http://localhost:3000",
  encryptionKey: process.env.ENCRYPTION_KEY ?? "",
};

// The JWT default is publicly known (committed to the repo). Any deployment
// using it allows tokens to be forged — crash regardless of NODE_ENV.
if (env.jwtSecret === DEV_JWT_DEFAULT) {
  throw new Error(
    "[FATAL] JWT_SECRET is still the insecure default value. " +
      "Set a secure random string in your environment before starting.",
  );
}

// Encryption key guards BYOK API keys stored in the DB. Empty key means
// secrets are effectively stored in plaintext — block production startups.
if (process.env.NODE_ENV === "production" && env.encryptionKey.length < 32) {
  throw new Error(
    "[FATAL] ENCRYPTION_KEY is empty or shorter than 32 characters. " +
      "Set a 32+ character secret in your production environment.",
  );
}
