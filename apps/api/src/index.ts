import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import formbody from "@fastify/formbody";
import helmet from "@fastify/helmet";
import { ZodError } from "zod";
import { connectMongo, ensurePgvector, isMongoReady, prisma } from "@quickstart-ai/db";
import { AppError } from "@quickstart-ai/shared";
import { env } from "./env.js";
import { assertRateLimit, getRedis } from "./redis.js";
import { authRoutes } from "./routes/auth.js";
import { projectRoutes } from "./routes/projects.js";
import { knowledgeRoutes } from "./routes/knowledge.js";
import { chatRoutes } from "./routes/chat.js";
import { agentInboxRoutes } from "./routes/agent-inbox.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { onboardingRoutes } from "./routes/onboarding.js";
import { integrationsRoutes } from "./routes/integrations.js";
import { projectIntegrationsRoutes } from "./routes/project-integrations.js";
import { customToolsRoutes } from "./routes/custom-tools.js";
import { mcpOAuthRoutes } from "./routes/mcp-oauth.js";
import { mcpHttpRoutes } from "./routes/mcp-http.js";

async function main() {
  const app = Fastify({
    logger: true,
    bodyLimit: 1_000_000,
    requestIdHeader: "x-request-id",
    genReqId: () => crypto.randomUUID(),
    requestTimeout: 120_000,
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: env.corsOrigins,
    credentials: true,
  });
  await app.register(cookie);
  await app.register(formbody);

  app.addHook("onRequest", async (req) => {
    const ip = req.ip || "unknown";
    const rl = await assertRateLimit(
      `ip:${ip}`,
      env.rateLimitMaxIp,
      env.rateLimitWindowMs,
    );
    if (!rl.allowed) {
      throw new AppError("Too many requests from this IP", 429, "RATE_LIMITED");
    }
  });

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ZodError) {
      return reply.status(400).send({
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid request",
        issues: err.issues,
      });
    }
    if (err instanceof AppError) {
      return reply.status(err.statusCode).send({
        success: false,
        code: err.code,
        message: err.message,
      });
    }
    app.log.error(err);
    return reply.status(500).send({
      success: false,
      code: "INTERNAL",
      message: "Internal server error",
    });
  });

  app.get("/health", async (_req, reply) => {
    const [pg, rd, mg] = await Promise.allSettled([
      prisma.$queryRaw`SELECT 1`,
      getRedis().ping(),
      isMongoReady()
        ? Promise.resolve()
        : Promise.reject(new Error("MongoDB not connected")),
    ]);
    const services = {
      postgres: pg.status === "fulfilled" ? "ok" : "error",
      redis: rd.status === "fulfilled" ? "ok" : "error",
      mongo: mg.status === "fulfilled" ? "ok" : "error",
    };
    const degraded = Object.values(services).some((s) => s === "error");
    return reply
      .status(degraded ? 503 : 200)
      .send({ status: degraded ? "degraded" : "ok", services });
  });

  app.get("/", async () => ({
    name: "QuickStart AI API",
    version: "0.1.0",
    docs: "/health",
  }));

  await authRoutes(app);
  await onboardingRoutes(app);
  await projectRoutes(app);
  await knowledgeRoutes(app);
  await chatRoutes(app);
  await agentInboxRoutes(app);
  await dashboardRoutes(app);
  await integrationsRoutes(app);
  await projectIntegrationsRoutes(app);
  await customToolsRoutes(app);
  await mcpOAuthRoutes(app);
  await mcpHttpRoutes(app);

  // Warm connections
  try {
    await prisma.$connect();
    await ensurePgvector();
  } catch (err) {
    app.log.warn({ err }, "Postgres not ready yet — start docker compose");
  }
  try {
    await connectMongo();
  } catch (err) {
    app.log.warn({ err }, "MongoDB not ready yet — start docker compose");
  }
  try {
    const redis = getRedis();
    await redis.connect();
  } catch (err) {
    app.log.warn({ err }, "Redis not ready yet — start docker compose");
  }

  await app.listen({ port: env.port, host: env.host });
  app.log.info(`QuickStart API listening on ${env.host}:${env.port}`);
  app.log.info({ publicApiUrl: env.publicApiUrl, webAppUrl: env.webAppUrl }, "MCP OAuth URLs");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
