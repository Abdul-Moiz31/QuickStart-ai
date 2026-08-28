import type { FastifyInstance } from "fastify";
import twilio from "twilio";
import { prisma } from "@quickstart-ai/db";
import { decryptSecret } from "@quickstart-ai/shared/secrets";
import { env } from "../env.js";
import { runChannelMessage } from "../channels/reply.js";
import {
  markReadWithTyping,
  parseWhatsappWebhook,
  sendWhatsappInteractive,
  sendWhatsappText,
  verifyMetaSignature,
  type WhatsappConfig,
} from "../channels/whatsapp.js";
import { parseInstagramWebhook, sendInstagramText, type InstagramConfig } from "../channels/instagram.js";

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

async function findWhatsappIntegration(phoneNumberId: string) {
  const row = await prisma.integrationConnection.findFirst({
    where: { provider: "whatsapp", externalId: phoneNumberId, enabled: true },
  });
  if (!row) return null;
  const config = JSON.parse(decryptSecret(row.configEnc)) as WhatsappConfig;
  return { projectId: row.projectId, config };
}

async function findInstagramIntegration(pageId: string) {
  const row = await prisma.integrationConnection.findFirst({
    where: { provider: "instagram", externalId: pageId, enabled: true },
  });
  if (!row) return null;
  const config = JSON.parse(decryptSecret(row.configEnc)) as InstagramConfig;
  return { projectId: row.projectId, config };
}

/**
 * One-time app-level handshake: Meta doesn't know which project this is for
 * (there's no phone number/page id in the query string), so it's matched by
 * scanning enabled integrations of that provider for a verify token match.
 * Only runs at setup time, not per message, so the O(n) decrypt scan is fine.
 */
async function findIntegrationByVerifyToken<T extends { verifyToken: string }>(
  provider: "whatsapp" | "instagram",
  token: string,
): Promise<T | null> {
  const rows = await prisma.integrationConnection.findMany({
    where: { provider, enabled: true },
  });
  for (const row of rows) {
    try {
      const config = JSON.parse(decryptSecret(row.configEnc)) as T;
      if (config.verifyToken === token) return config;
    } catch {
      // skip rows that fail to decrypt
    }
  }
  return null;
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

  app.get("/api/v1/channels/whatsapp", async (req, reply) => {
    const query = req.query as Record<string, string>;
    const mode = query["hub.mode"];
    const token = query["hub.verify_token"];
    const challenge = query["hub.challenge"];
    if (mode !== "subscribe" || !token) {
      return reply.status(403).send("Forbidden");
    }
    const match = await findIntegrationByVerifyToken<WhatsappConfig>("whatsapp", token);
    if (!match) {
      req.log.warn("WhatsApp webhook verification: no matching verify token");
      return reply.status(403).send("Forbidden");
    }
    return reply.status(200).type("text/plain").send(challenge ?? "");
  });

  // Signature verification needs the exact raw bytes Meta signed, so this route
  // gets its own encapsulated plugin with a buffer-mode content-type parser —
  // Fastify scopes addContentTypeParser to the registering context, so this
  // doesn't affect the global JSON parser used by every other route.
  await app.register(async (scoped) => {
    scoped.addContentTypeParser("application/json", { parseAs: "buffer" }, (_req, body, done) => {
      done(null, body);
    });

    scoped.post("/api/v1/channels/whatsapp", async (req, reply) => {
      const raw = req.body as Buffer;
      let payload: unknown;
      try {
        payload = JSON.parse(raw.toString("utf8"));
      } catch {
        return reply.status(400).send("Bad request");
      }

      const parsed = parseWhatsappWebhook(payload);
      if (!parsed) {
        // Non-message webhook (status update, etc.) — acknowledge and ignore.
        return reply.status(200).send("OK");
      }

      const integration = await findWhatsappIntegration(parsed.phoneNumberId);
      if (!integration) {
        req.log.warn({ phoneNumberId: parsed.phoneNumberId }, "WhatsApp webhook: no project configured for this number");
        return reply.status(200).send("OK");
      }

      const signature = req.headers["x-hub-signature-256"] as string | undefined;
      if (!verifyMetaSignature(raw, signature, integration.config.appSecret)) {
        req.log.warn({ phoneNumberId: parsed.phoneNumberId }, "WhatsApp webhook: signature verification failed");
        return reply.status(403).send("Forbidden");
      }

      void markReadWithTyping(integration.config, parsed.messageId);

      // Both plain text and a tapped button/list reply arrive with parsed.text
      // set (see parseWhatsappWebhook) — anything else (image, voice note, …)
      // gets the fallback since inbound media isn't handled yet.
      if (!parsed.text) {
        await sendWhatsappText(
          integration.config,
          parsed.from,
          "Sorry, I can only understand text messages right now — could you type your question?",
        ).catch((err) => req.log.error({ err }, "WhatsApp fallback send failed"));
        return reply.status(200).send("OK");
      }

      const result = await runChannelMessage({
        projectId: integration.projectId,
        channel: "whatsapp",
        externalId: parsed.from,
        message: parsed.text,
        log: req.log,
        rateLimit: { key: `wa:${parsed.from}`, limit: 20, windowMs: 60_000 },
      });

      if (result.kind === "answer" && result.quickReplies) {
        await sendWhatsappText(integration.config, parsed.from, result.answer).catch((err) =>
          req.log.error({ err }, "WhatsApp reply send failed"),
        );
        await sendWhatsappInteractive(integration.config, parsed.from, result.quickReplies).catch((err) =>
          req.log.error({ err }, "WhatsApp interactive send failed"),
        );
      } else {
        let replyText: string | null = null;
        if (result.kind === "answer") replyText = result.answer;
        else if (result.kind === "rate_limited") replyText = "You're sending messages too quickly. Please wait a moment.";
        else if (result.kind === "plan_limit") replyText = "This business has reached its daily message limit. Please try again tomorrow.";
        else if (result.kind === "error") replyText = result.message;
        // "human_active" and "no_project" send nothing back.

        if (replyText) {
          await sendWhatsappText(integration.config, parsed.from, replyText).catch((err) =>
            req.log.error({ err }, "WhatsApp reply send failed"),
          );
        }
      }

      return reply.status(200).send("OK");
    });
  });

  app.get("/api/v1/channels/instagram", async (req, reply) => {
    const query = req.query as Record<string, string>;
    const mode = query["hub.mode"];
    const token = query["hub.verify_token"];
    const challenge = query["hub.challenge"];
    if (mode !== "subscribe" || !token) {
      return reply.status(403).send("Forbidden");
    }
    const match = await findIntegrationByVerifyToken<InstagramConfig>("instagram", token);
    if (!match) {
      req.log.warn("Instagram webhook verification: no matching verify token");
      return reply.status(403).send("Forbidden");
    }
    return reply.status(200).type("text/plain").send(challenge ?? "");
  });

  // Same raw-body requirement as WhatsApp — see that route's comment above.
  await app.register(async (scoped) => {
    scoped.addContentTypeParser("application/json", { parseAs: "buffer" }, (_req, body, done) => {
      done(null, body);
    });

    scoped.post("/api/v1/channels/instagram", async (req, reply) => {
      const raw = req.body as Buffer;
      let payload: unknown;
      try {
        payload = JSON.parse(raw.toString("utf8"));
      } catch {
        return reply.status(400).send("Bad request");
      }

      const parsed = parseInstagramWebhook(payload);
      if (!parsed) {
        return reply.status(200).send("OK");
      }

      const integration = await findInstagramIntegration(parsed.pageId);
      if (!integration) {
        req.log.warn({ pageId: parsed.pageId }, "Instagram webhook: no project configured for this page");
        return reply.status(200).send("OK");
      }

      const signature = req.headers["x-hub-signature-256"] as string | undefined;
      if (!verifyMetaSignature(raw, signature, integration.config.appSecret)) {
        req.log.warn({ pageId: parsed.pageId }, "Instagram webhook: signature verification failed");
        return reply.status(403).send("Forbidden");
      }

      if (!parsed.text) {
        await sendInstagramText(
          integration.config,
          parsed.from,
          "Sorry, I can only understand text messages right now — could you type your question?",
        ).catch((err) => req.log.error({ err }, "Instagram fallback send failed"));
        return reply.status(200).send("OK");
      }

      const result = await runChannelMessage({
        projectId: integration.projectId,
        channel: "instagram",
        externalId: parsed.from,
        message: parsed.text,
        log: req.log,
        rateLimit: { key: `ig:${parsed.from}`, limit: 20, windowMs: 60_000 },
      });

      let replyText: string | null = null;
      if (result.kind === "answer") replyText = result.answer;
      else if (result.kind === "rate_limited") replyText = "You're sending messages too quickly. Please wait a moment.";
      else if (result.kind === "plan_limit") replyText = "This business has reached its daily message limit. Please try again tomorrow.";
      else if (result.kind === "error") replyText = result.message;
      // "human_active" and "no_project" send nothing back.

      if (replyText) {
        await sendInstagramText(integration.config, parsed.from, replyText).catch((err) =>
          req.log.error({ err }, "Instagram reply send failed"),
        );
      }

      return reply.status(200).send("OK");
    });
  });
}
