import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { prisma } from "@quickstart-ai/db";
import {
  AppError,
  loginSchema,
  registerSchema,
  UnauthorizedError,
} from "@quickstart-ai/shared";
import { requireAuth, setAuthCookie, signToken } from "../auth.js";

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
}
