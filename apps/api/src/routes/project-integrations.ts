import type { FastifyInstance } from "fastify";
import { randomBytes } from "node:crypto";
import { prisma } from "@quickstart-ai/db";
import {
  assertPublicHttpsUrl,
  deliverTestPingToIntegration,
  deliverTestPingToWebhook,
  maskUrl,
} from "@quickstart-ai/events";
import {
  AppError,
  createEventRuleSchema,
  createSlackIntegrationSchema,
  createDiscordIntegrationSchema,
  createInstagramIntegrationSchema,
  createTwilioIntegrationSchema,
  createWhatsappIntegrationSchema,
  createWebhookSchema,
  EVENT_CATALOG,
  EVENT_LIMITS,
  NotFoundError,
  updateEventRuleSchema,
  updateIntegrationSchema,
  updateWebhookSchema,
} from "@quickstart-ai/shared";
import { encryptSecret } from "@quickstart-ai/shared/secrets";
import { requireAuth } from "../auth.js";
import { env } from "../env.js";

async function requireProject(projectId: string, ownerId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
  });
  if (!project) throw new NotFoundError("Project not found");
  return project;
}

export async function projectIntegrationsRoutes(app: FastifyInstance) {
  app.get("/api/v1/projects/:id/integrations/catalog", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await requireProject(id, req.user!.id);
    return { success: true, catalog: EVENT_CATALOG };
  });

  app.get("/api/v1/projects/:id/webhooks", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await requireProject(id, req.user!.id);
    const rows = await prisma.webhookEndpoint.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
    });
    return {
      success: true,
      webhooks: rows.map((w) => ({
        id: w.id,
        label: w.label,
        description: w.description,
        url: maskUrl(w.url),
        events: w.events,
        enabled: w.enabled,
        createdAt: w.createdAt,
      })),
    };
  });

  app.post("/api/v1/projects/:id/webhooks", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await requireProject(id, req.user!.id);
    const body = createWebhookSchema.parse(req.body);

    const count = await prisma.webhookEndpoint.count({ where: { projectId: id } });
    if (count >= EVENT_LIMITS.webhooksPerProject) {
      return { success: false, message: `Maximum ${EVENT_LIMITS.webhooksPerProject} webhooks per project` };
    }

    assertPublicHttpsUrl(body.url);
    const secret = randomBytes(32).toString("hex");
    const row = await prisma.webhookEndpoint.create({
      data: {
        projectId: id,
        label: body.label,
        description: body.description ?? "",
        url: body.url,
        secretEnc: encryptSecret(secret),
        events: body.events,
        enabled: body.enabled ?? true,
      },
    });

    return {
      success: true,
      webhook: {
        id: row.id,
        label: row.label,
        description: row.description,
        url: maskUrl(row.url),
        events: row.events,
        enabled: row.enabled,
        secret,
      },
    };
  });

  app.patch("/api/v1/projects/:id/webhooks/:wid", async (req) => {
    await requireAuth(req);
    const { id, wid } = req.params as { id: string; wid: string };
    await requireProject(id, req.user!.id);
    const body = updateWebhookSchema.parse(req.body);

    const existing = await prisma.webhookEndpoint.findFirst({
      where: { id: wid, projectId: id },
    });
    if (!existing) throw new NotFoundError("Webhook not found");
    if (body.url) assertPublicHttpsUrl(body.url);

    const row = await prisma.webhookEndpoint.update({
      where: { id: wid },
      data: {
        label: body.label,
        description: body.description,
        url: body.url,
        events: body.events,
        enabled: body.enabled,
      },
    });

    return {
      success: true,
      webhook: {
        id: row.id,
        label: row.label,
        description: row.description,
        url: maskUrl(row.url),
        events: row.events,
        enabled: row.enabled,
      },
    };
  });

  app.delete("/api/v1/projects/:id/webhooks/:wid", async (req) => {
    await requireAuth(req);
    const { id, wid } = req.params as { id: string; wid: string };
    await requireProject(id, req.user!.id);
    const existing = await prisma.webhookEndpoint.findFirst({
      where: { id: wid, projectId: id },
    });
    if (!existing) throw new NotFoundError("Webhook not found");
    await prisma.webhookEndpoint.delete({ where: { id: wid } });
    return { success: true };
  });

  app.post("/api/v1/projects/:id/webhooks/:wid/test", async (req) => {
    await requireAuth(req);
    const { id, wid } = req.params as { id: string; wid: string };
    await requireProject(id, req.user!.id);
    const existing = await prisma.webhookEndpoint.findFirst({
      where: { id: wid, projectId: id },
    });
    if (!existing) throw new NotFoundError("Webhook not found");

    try {
      const code = await deliverTestPingToWebhook({
        projectId: id,
        url: existing.url,
        secretEnc: existing.secretEnc,
        label: existing.label,
      });
      return { success: true, message: `Test delivered (${code})` };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Test delivery failed";
      throw new AppError(message, 502, "DELIVERY_FAILED");
    }
  });

  app.get("/api/v1/projects/:id/integrations", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await requireProject(id, req.user!.id);
    const rows = await prisma.integrationConnection.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
    });
    return {
      success: true,
      integrations: rows.map((r) => ({
        id: r.id,
        provider: r.provider,
        label: r.label,
        description: r.description,
        events: r.events,
        enabled: r.enabled,
        createdAt: r.createdAt,
      })),
    };
  });

  app.post("/api/v1/projects/:id/integrations/slack", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await requireProject(id, req.user!.id);
    const body = createSlackIntegrationSchema.parse(req.body);

    const count = await prisma.integrationConnection.count({ where: { projectId: id } });
    if (count >= EVENT_LIMITS.integrationsPerProject) {
      return {
        success: false,
        message: `Maximum ${EVENT_LIMITS.integrationsPerProject} integrations per project`,
      };
    }

    assertPublicHttpsUrl(body.webhookUrl);
    const row = await prisma.integrationConnection.create({
      data: {
        projectId: id,
        provider: "slack",
        label: body.label ?? "Slack",
        description: body.description ?? "",
        configEnc: encryptSecret(JSON.stringify({ webhookUrl: body.webhookUrl })),
        events: body.events,
        enabled: body.enabled ?? true,
      },
    });

    return {
      success: true,
      integration: {
        id: row.id,
        provider: row.provider,
        label: row.label,
        description: row.description,
        events: row.events,
        enabled: row.enabled,
      },
    };
  });

  app.post("/api/v1/projects/:id/integrations/discord", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await requireProject(id, req.user!.id);
    const body = createDiscordIntegrationSchema.parse(req.body);

    const count = await prisma.integrationConnection.count({ where: { projectId: id } });
    if (count >= EVENT_LIMITS.integrationsPerProject) {
      return {
        success: false,
        message: `Maximum ${EVENT_LIMITS.integrationsPerProject} integrations per project`,
      };
    }

    assertPublicHttpsUrl(body.webhookUrl);
    const row = await prisma.integrationConnection.create({
      data: {
        projectId: id,
        provider: "discord",
        label: body.label ?? "Discord",
        description: body.description ?? "",
        configEnc: encryptSecret(JSON.stringify({ webhookUrl: body.webhookUrl })),
        events: body.events,
        enabled: body.enabled ?? true,
      },
    });

    return {
      success: true,
      integration: {
        id: row.id,
        provider: row.provider,
        label: row.label,
        description: row.description,
        events: row.events,
        enabled: row.enabled,
      },
    };
  });

  app.post("/api/v1/projects/:id/integrations/sms", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await requireProject(id, req.user!.id);
    const body = createTwilioIntegrationSchema.parse(req.body);

    const count = await prisma.integrationConnection.count({ where: { projectId: id } });
    if (count >= EVENT_LIMITS.integrationsPerProject) {
      return {
        success: false,
        message: `Maximum ${EVENT_LIMITS.integrationsPerProject} integrations per project`,
      };
    }

    const row = await prisma.integrationConnection.create({
      data: {
        projectId: id,
        provider: "sms",
        label: body.label ?? "SMS",
        description: body.description ?? "",
        configEnc: encryptSecret(
          JSON.stringify({
            accountSid: body.accountSid,
            authToken: body.authToken,
            fromNumber: body.fromNumber,
          }),
        ),
        // Channel integrations aren't domain-event notification targets — inbound
        // messages are handled directly by the /api/v1/channels/sms webhook.
        events: [],
        enabled: body.enabled ?? true,
        externalId: body.fromNumber,
      },
    });

    return {
      success: true,
      integration: {
        id: row.id,
        provider: row.provider,
        label: row.label,
        description: row.description,
        enabled: row.enabled,
        webhookUrl: `${env.publicApiUrl.replace(/\/$/, "")}/api/v1/channels/sms`,
      },
    };
  });

  app.post("/api/v1/projects/:id/integrations/whatsapp", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await requireProject(id, req.user!.id);
    const body = createWhatsappIntegrationSchema.parse(req.body);

    const count = await prisma.integrationConnection.count({ where: { projectId: id } });
    if (count >= EVENT_LIMITS.integrationsPerProject) {
      return {
        success: false,
        message: `Maximum ${EVENT_LIMITS.integrationsPerProject} integrations per project`,
      };
    }

    const row = await prisma.integrationConnection.create({
      data: {
        projectId: id,
        provider: "whatsapp",
        label: body.label ?? "WhatsApp",
        description: body.description ?? "",
        configEnc: encryptSecret(
          JSON.stringify({
            phoneNumberId: body.phoneNumberId,
            accessToken: body.accessToken,
            appSecret: body.appSecret,
            verifyToken: body.verifyToken,
          }),
        ),
        events: [],
        enabled: body.enabled ?? true,
        externalId: body.phoneNumberId,
      },
    });

    return {
      success: true,
      integration: {
        id: row.id,
        provider: row.provider,
        label: row.label,
        description: row.description,
        enabled: row.enabled,
        webhookUrl: `${env.publicApiUrl.replace(/\/$/, "")}/api/v1/channels/whatsapp`,
      },
    };
  });

  app.post("/api/v1/projects/:id/integrations/instagram", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await requireProject(id, req.user!.id);
    const body = createInstagramIntegrationSchema.parse(req.body);

    const count = await prisma.integrationConnection.count({ where: { projectId: id } });
    if (count >= EVENT_LIMITS.integrationsPerProject) {
      return {
        success: false,
        message: `Maximum ${EVENT_LIMITS.integrationsPerProject} integrations per project`,
      };
    }

    const row = await prisma.integrationConnection.create({
      data: {
        projectId: id,
        provider: "instagram",
        label: body.label ?? "Instagram",
        description: body.description ?? "",
        configEnc: encryptSecret(
          JSON.stringify({
            pageId: body.pageId,
            pageAccessToken: body.pageAccessToken,
            appSecret: body.appSecret,
            verifyToken: body.verifyToken,
          }),
        ),
        events: [],
        enabled: body.enabled ?? true,
        externalId: body.pageId,
      },
    });

    return {
      success: true,
      integration: {
        id: row.id,
        provider: row.provider,
        label: row.label,
        description: row.description,
        enabled: row.enabled,
        webhookUrl: `${env.publicApiUrl.replace(/\/$/, "")}/api/v1/channels/instagram`,
      },
    };
  });

  app.patch("/api/v1/projects/:id/integrations/:iid", async (req) => {
    await requireAuth(req);
    const { id, iid } = req.params as { id: string; iid: string };
    await requireProject(id, req.user!.id);
    const body = updateIntegrationSchema.parse(req.body);
    const existing = await prisma.integrationConnection.findFirst({
      where: { id: iid, projectId: id },
    });
    if (!existing) throw new NotFoundError("Integration not found");

    const row = await prisma.integrationConnection.update({
      where: { id: iid },
      data: {
        label: body.label,
        description: body.description,
        events: body.events,
        enabled: body.enabled,
      },
    });

    return {
      success: true,
      integration: {
        id: row.id,
        provider: row.provider,
        label: row.label,
        description: row.description,
        events: row.events,
        enabled: row.enabled,
      },
    };
  });

  app.delete("/api/v1/projects/:id/integrations/:iid", async (req) => {
    await requireAuth(req);
    const { id, iid } = req.params as { id: string; iid: string };
    await requireProject(id, req.user!.id);
    const existing = await prisma.integrationConnection.findFirst({
      where: { id: iid, projectId: id },
    });
    if (!existing) throw new NotFoundError("Integration not found");
    await prisma.integrationConnection.delete({ where: { id: iid } });
    return { success: true };
  });

  app.post("/api/v1/projects/:id/integrations/:iid/test", async (req) => {
    await requireAuth(req);
    const { id, iid } = req.params as { id: string; iid: string };
    await requireProject(id, req.user!.id);
    const existing = await prisma.integrationConnection.findFirst({
      where: { id: iid, projectId: id },
    });
    if (!existing) throw new NotFoundError("Integration not found");

    try {
      const code = await deliverTestPingToIntegration({
        projectId: id,
        provider: existing.provider,
        configEnc: existing.configEnc,
        label: existing.label,
      });
      return { success: true, message: `Test delivered (${code})` };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Test delivery failed";
      throw new AppError(message, 502, "DELIVERY_FAILED");
    }
  });

  app.get("/api/v1/projects/:id/event-rules", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await requireProject(id, req.user!.id);
    const rules = await prisma.eventRule.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, rules };
  });

  app.post("/api/v1/projects/:id/event-rules", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await requireProject(id, req.user!.id);
    const body = createEventRuleSchema.parse(req.body);

    const count = await prisma.eventRule.count({ where: { projectId: id } });
    if (count >= EVENT_LIMITS.rulesPerProject) {
      return {
        success: false,
        message: `Maximum ${EVENT_LIMITS.rulesPerProject} custom event rules per project`,
      };
    }

    const rule = await prisma.eventRule.create({
      data: {
        projectId: id,
        name: body.name,
        description: body.description ?? "",
        eventType: body.eventType,
        enabled: body.enabled ?? true,
        triggers: body.triggers,
        destinations: body.destinations,
      },
    });
    return { success: true, rule };
  });

  app.patch("/api/v1/projects/:id/event-rules/:rid", async (req) => {
    await requireAuth(req);
    const { id, rid } = req.params as { id: string; rid: string };
    await requireProject(id, req.user!.id);
    const body = updateEventRuleSchema.parse(req.body);
    const existing = await prisma.eventRule.findFirst({
      where: { id: rid, projectId: id },
    });
    if (!existing) throw new NotFoundError("Event rule not found");

    const rule = await prisma.eventRule.update({
      where: { id: rid },
      data: {
        name: body.name,
        description: body.description,
        eventType: body.eventType,
        enabled: body.enabled,
        triggers: body.triggers,
        destinations: body.destinations,
      },
    });
    return { success: true, rule };
  });

  app.delete("/api/v1/projects/:id/event-rules/:rid", async (req) => {
    await requireAuth(req);
    const { id, rid } = req.params as { id: string; rid: string };
    await requireProject(id, req.user!.id);
    const existing = await prisma.eventRule.findFirst({
      where: { id: rid, projectId: id },
    });
    if (!existing) throw new NotFoundError("Event rule not found");
    await prisma.eventRule.delete({ where: { id: rid } });
    return { success: true };
  });

  app.get("/api/v1/projects/:id/events", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await requireProject(id, req.user!.id);
    const q = req.query as { type?: string; limit?: string; cursor?: string };
    const limit = Math.min(Number(q.limit ?? 30), 100);

    const events = await prisma.projectEvent.findMany({
      where: {
        projectId: id,
        ...(q.type ? { type: q.type } : {}),
        ...(q.cursor ? { id: { lt: q.cursor } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        deliveries: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            attempts: true,
            lastError: true,
            responseCode: true,
            deliveredAt: true,
            endpointId: true,
            integrationId: true,
          },
        },
      },
    });

    return {
      success: true,
      events,
      nextCursor: events.length === limit ? events[events.length - 1]?.id : null,
    };
  });

  app.get("/api/v1/projects/:id/deliveries", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await requireProject(id, req.user!.id);
    const q = req.query as { status?: string; limit?: string };
    const limit = Math.min(Number(q.limit ?? 50), 100);

    const deliveries = await prisma.webhookDelivery.findMany({
      where: {
        event: { projectId: id },
        ...(q.status ? { status: q.status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        event: { select: { id: true, type: true, name: true, createdAt: true } },
        endpoint: { select: { id: true, label: true } },
        integration: { select: { id: true, label: true, provider: true } },
      },
    });

    return { success: true, deliveries };
  });
}
