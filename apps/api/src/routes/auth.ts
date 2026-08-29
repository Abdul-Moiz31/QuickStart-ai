import { randomBytes, createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@quickstart-ai/db";
import {
  AppError,
  loginSchema,
  registerSchema,
  UnauthorizedError,
} from "@quickstart-ai/shared";
import { requireAuth, setAuthCookie, signToken } from "../auth.js";
import { env } from "../env.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/api/v1/auth/register", async (req, reply) => {
    const body = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw new AppError("User already exists", 400);

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        onboardingCompleted: false,
        projects: {
          create: {
            name: "Default project",
            description: "Your first chatbot — finish onboarding to train it.",
          },
        },
      },
      include: { projects: { select: { id: true, name: true }, take: 1 } },
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    setAuthCookie(reply, token);
    return {
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        onboardingCompleted: false,
      },
      defaultProject: user.projects[0] ?? null,
      needsOnboarding: true,
    };
  });

  app.post("/api/v1/auth/login", async (req, reply) => {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) throw new UnauthorizedError("Invalid email or password");
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError("Invalid email or password");

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    setAuthCookie(reply, token);
    return {
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  });

  app.post("/api/v1/auth/logout", async (_req, reply) => {
    reply.clearCookie("token", { path: "/" });
    return { success: true, message: "Logged out" };
  });

  app.get("/api/v1/auth/me", async (req) => {
    await requireAuth(req);
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        onboardingCompleted: true,
        businessName: true,
      },
    });
    if (!user) throw new UnauthorizedError();
    return { success: true, user };
  });

  app.post("/api/v1/auth/forgot-password", async (req, reply) => {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return reply.send({ success: true, message: "If that email exists, a reset link was sent." });
    }

    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const resetUrl = `${env.webAppUrl}/reset-password?token=${rawToken}`;
    req.log.info({ resetUrl, email }, "[auth] password reset token generated");

    return reply.send({
      success: true,
      message: "If that email exists, a reset link was sent.",
      // Expose the URL outside production so dev/staging can test without a mailer
      ...(process.env.NODE_ENV !== "production" && { resetUrl }),
    });
  });

  app.post("/api/v1/auth/reset-password", async (req) => {
    const { token, password } = z
      .object({
        token: z.string().length(64),
        password: z.string().min(8).max(128),
      })
      .parse(req.body);

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new AppError("Invalid or expired reset token", 400, "INVALID_TOKEN");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    return { success: true, message: "Password updated. You can now log in." };
  });
}
