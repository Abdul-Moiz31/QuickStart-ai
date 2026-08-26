import { prisma } from "@quickstart-ai/db";
import { BUILTIN_EVENT_TYPES } from "@quickstart-ai/shared";
import { decryptSecret } from "@quickstart-ai/shared/secrets";
import { buildEventEnvelope } from "./payload.js";
import { formatSlackMessage, postToSlack } from "./deliver/slack.js";
import { formatDiscordMessage, postToDiscord } from "./deliver/discord.js";
import { nextRetryDelay, postWebhook } from "./deliver/webhook.js";

async function deliverIntegration(
  provider: string,
  configEnc: string,
  envelope: ReturnType<typeof buildEventEnvelope>,
): Promise<number> {
  const config = JSON.parse(decryptSecret(configEnc)) as { webhookUrl: string };
  if (provider === "slack") {
    return postToSlack(config.webhookUrl, formatSlackMessage(envelope));
  }
  if (provider === "discord") {
    return postToDiscord(config.webhookUrl, formatDiscordMessage(envelope));
  }
  throw new Error(`Unknown integration provider: ${provider}`);
}

function eventMatchesSubscription(subscribed: string[], type: string): boolean {
  if (subscribed.includes("*")) return true;
  return subscribed.includes(type);
}

/**
 * Dashboard links included with every delivered event.
 *
 * Handoff events also carry an inbox link: the notification is the moment somebody
 * decides whether to step in, and the conversation view has no reply box.
 */
function dashboardLinks(
  projectId: string,
  sessionId: string | null,
  type: string,
): { conversation_url?: string; inbox_url?: string } {
  if (!sessionId) return {};
  const webAppUrl = (process.env.WEB_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const base = `${webAppUrl}/dashboard/projects/${projectId}`;
  return {
    conversation_url: `${base}/conversations?session=${sessionId}`,
    ...(type === BUILTIN_EVENT_TYPES.HUMAN_HANDOFF
      ? { inbox_url: `${base}/inbox?session=${sessionId}` }
      : {}),
  };
}

export async function deliverProjectEvent(eventId: string): Promise<void> {
  const event = await prisma.projectEvent.findUnique({
    where: { id: eventId },
    include: { project: { select: { id: true, name: true } } },
  });
  if (!event) return;

  const links = dashboardLinks(event.projectId, event.sessionId, event.type);

  const payload = event.payload as Record<string, unknown>;
  const envelope = buildEventEnvelope({
    id: event.id,
    type: event.type,
    name: event.name,
    description: event.description,
    projectId: event.projectId,
    createdAt: event.createdAt,
    data: {
      ...payload,
      session_id: event.sessionId,
      project_name: event.project.name,
      ...links,
      visitor: payload.visitor ?? undefined,
    },
  });

  const [endpoints, integrations] = await Promise.all([
    prisma.webhookEndpoint.findMany({
      where: { projectId: event.projectId, enabled: true },
    }),
    prisma.integrationConnection.findMany({
      where: { projectId: event.projectId, enabled: true },
    }),
  ]);

  const targets: Array<
    | { kind: "webhook"; id: string; url: string; secretEnc: string }
    | { kind: "integration"; id: string; provider: string; configEnc: string }
  > = [];

  for (const ep of endpoints) {
    if (eventMatchesSubscription(ep.events, event.type)) {
      targets.push({ kind: "webhook", id: ep.id, url: ep.url, secretEnc: ep.secretEnc });
    }
  }
  for (const integ of integrations) {
    if (eventMatchesSubscription(integ.events, event.type)) {
      targets.push({
        kind: "integration",
        id: integ.id,
        provider: integ.provider,
        configEnc: integ.configEnc,
      });
    }
  }

  if (!targets.length) return;

  await Promise.allSettled(
    targets.map(async (target) => {
      const delivery = await prisma.webhookDelivery.create({
        data: {
          eventId: event.id,
          endpointId: target.kind === "webhook" ? target.id : null,
          integrationId: target.kind === "integration" ? target.id : null,
          status: "pending",
        },
      });

      try {
        let code: number;
        if (target.kind === "webhook") {
          const secret = decryptSecret(target.secretEnc);
          code = await postWebhook(target.url, secret, envelope, delivery.id);
        } else {
          code = await deliverIntegration(target.provider, target.configEnc, envelope);
        }

        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "success",
            attempts: 1,
            responseCode: code,
            deliveredAt: new Date(),
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const delay = nextRetryDelay(1);
        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: delay ? "retrying" : "failed",
            attempts: 1,
            lastError: message,
            nextRetryAt: delay ? new Date(Date.now() + delay) : null,
          },
        });
        throw err;
      }
    }),
  );
}

export async function retryDelivery(deliveryId: string): Promise<void> {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: {
      event: { include: { project: { select: { id: true, name: true } } } },
      endpoint: true,
      integration: true,
    },
  });
  if (!delivery?.event) return;

  const event = delivery.event;
  const payload = event.payload as Record<string, unknown>;
  const envelope = buildEventEnvelope({
    id: event.id,
    type: event.type,
    name: event.name,
    description: event.description,
    projectId: event.projectId,
    createdAt: event.createdAt,
    data: {
      ...payload,
      session_id: event.sessionId,
      project_name: event.project.name,
      ...dashboardLinks(event.projectId, event.sessionId, event.type),
    },
  });

  const attempts = delivery.attempts + 1;

  try {
    let code: number;
    if (delivery.endpoint) {
      const secret = decryptSecret(delivery.endpoint.secretEnc);
      code = await postWebhook(delivery.endpoint.url, secret, envelope, delivery.id);
    } else if (delivery.integration) {
      code = await deliverIntegration(
        delivery.integration.provider,
        delivery.integration.configEnc,
        envelope,
      );
    } else {
      throw new Error("Delivery target missing");
    }

    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "success",
        attempts,
        responseCode: code,
        deliveredAt: new Date(),
        lastError: null,
        nextRetryAt: null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const delay = nextRetryDelay(attempts);
    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: delay ? "retrying" : "failed",
        attempts,
        lastError: message,
        nextRetryAt: delay ? new Date(Date.now() + delay) : null,
      },
    });
  }
}
