import type { FastifyInstance } from "fastify";
import twilio from "twilio";
import { prisma } from "@quickstart-ai/db";
import { decryptSecret } from "@quickstart-ai/shared/secrets";
import { env } from "../env.js";
import { runChannelMessage } from "../channels/reply.js";

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

async function findSmsIntegration(toNumber: string) {
  const row = await prisma.integrationConnection.findFirst({
    where: { provider: "sms", externalId: toNumber, enabled: true },
  });
  if (!row) return null;
  const config = JSON.parse(decryptSecret(row.configEnc)) as TwilioConfig;
  return { projectId: row.projectId, config };
}

function twiml(message: string): string {
  const escaped = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;
}

export async function channelsRoutes(app: FastifyInstance) {
  // Twilio posts application/x-www-form-urlencoded, already parsed by @fastify/formbody.
  app.post("/api/v1/channels/sms", async (req, reply) => {
    const body = req.body as Record<string, string>;
    const to = body.To;
    const from = body.From;
    const messageBody = (body.Body ?? "").trim();

    if (!to || !from) {
      return reply.status(400).type("text/xml").send(twiml("Malformed request."));
    }

    const integration = await findSmsIntegration(to);
    if (!integration) {
      req.log.warn({ to }, "SMS webhook: no project configured for this number");
      return reply.status(404).type("text/xml").send(twiml(""));
    }

    const signature = req.headers["x-twilio-signature"] as string | undefined;
    const webhookUrl = `${env.publicApiUrl.replace(/\/$/, "")}/api/v1/channels/sms`;
    const validSignature =
      !!signature &&
      twilio.validateRequest(integration.config.authToken, signature, webhookUrl, body);
    if (!validSignature) {
      req.log.warn({ to }, "SMS webhook: signature verification failed");
      return reply.status(403).send("Forbidden");
    }

    if (!messageBody) {
      return reply.type("text/xml").send(twiml(""));
    }

    const result = await runChannelMessage({
      projectId: integration.projectId,
      channel: "sms",
      externalId: from,
      message: messageBody,
      log: req.log,
      rateLimit: { key: `sms:${from}`, limit: 20, windowMs: 60_000 },
    });

    if (result.kind === "answer") {
      return reply.type("text/xml").send(twiml(result.answer));
    }
    if (result.kind === "human_active") {
      // A dashboard agent has taken over — no automated reply; they respond
      // from the inbox in a later pass (channel-outbound replies aren't wired yet).
      return reply.type("text/xml").send(twiml(""));
    }
    if (result.kind === "rate_limited") {
      return reply.type("text/xml").send(twiml("You're sending messages too quickly. Please wait a moment."));
    }
    if (result.kind === "plan_limit") {
      return reply.type("text/xml").send(twiml("This business has reached its daily message limit. Please try again tomorrow."));
    }
    return reply.type("text/xml").send(twiml("Sorry, something went wrong. Please try again."));
  });
}
