import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { prisma } from "@quickstart-ai/db";
import { UnauthorizedError, ForbiddenError } from "@quickstart-ai/shared";
import { env } from "./env.js";
import { hashSecret, timingSafeEqualHex } from "./credentials.js";
import { assertRateLimit } from "./redis.js";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
    projectId?: string;
    clientId?: string;
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);
}

export function setAuthCookie(reply: FastifyReply, token: string) {
  reply.setCookie("token", token, {
    path: "/",
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function requireAuth(req: FastifyRequest) {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const token = bearer || req.cookies.token;
  if (!token) throw new UnauthorizedError("Please login");

  try {
    const payload = jwt.verify(token, env.jwtSecret) as {
      sub: string;
      email: string;
      role: string;
    };
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    throw new UnauthorizedError("Invalid session");
  }
}

export async function requireAdmin(req: FastifyRequest) {
  await requireAuth(req);
  if (req.user?.role !== "ADMIN") throw new ForbiddenError("Admin only");
}

export interface ClientAuthOptions {
  /**
   * Record lastUsedAt on the credential. Defaults to true.
   *
   * High-frequency, low-value endpoints (typing pings) turn this off: the write
   * is one Postgres round trip per call, and "last used" is not meaningfully
   * more accurate for being updated by a keystroke than by a message.
   */
  touch?: boolean;
}

/** Widget / public chat auth via client_id (+ optional secret for server-to-server). */
export async function requireClient(req: FastifyRequest, opts: ClientAuthOptions = {}) {
  const clientId =
    (req.headers["x-client-id"] as string | undefined) ||
    (req.query as { clientId?: string }).clientId;
  const clientSecret = req.headers["x-client-secret"] as string | undefined;

  if (!clientId) throw new UnauthorizedError("client_id required");

  const cred = await prisma.apiCredential.findUnique({
    where: { clientId },
    include: { project: true },
  });
  if (!cred || cred.revokedAt) throw new UnauthorizedError("Invalid client_id");

  if (clientSecret) {
    const ok = timingSafeEqualHex(hashSecret(clientSecret), cred.clientSecretHash);
    if (!ok) throw new UnauthorizedError("Invalid client_secret");
  }

  const origin = req.headers.origin;
  if (origin && cred.project.allowedOrigins.length > 0) {
    const allowed = cred.project.allowedOrigins.some((o) => o === origin || o === "*");
    if (!allowed) throw new ForbiddenError("Origin not allowed for this project");
  }

  const rl = await assertRateLimit(
    `client:${clientId}`,
    Number(process.env.RATE_LIMIT_MAX_CLIENT ?? 120),
    Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  );
  if (!rl.allowed) throw new ForbiddenError("Rate limit exceeded for client");

  if (opts.touch !== false) {
    await prisma.apiCredential.update({
      where: { id: cred.id },
      data: { lastUsedAt: new Date() },
    });
  }

  req.projectId = cred.projectId;
  req.clientId = clientId;
}
