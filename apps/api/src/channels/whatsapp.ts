import { createHmac, timingSafeEqual } from "node:crypto";

export interface WhatsappConfig {
  phoneNumberId: string;
  accessToken: string;
  appSecret: string;
  verifyToken: string;
}

const GRAPH_API = "https://graph.facebook.com/v20.0";

export function verifyMetaSignature(rawBody: Buffer, signatureHeader: string | undefined, appSecret: string): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const provided = signatureHeader.slice("sha256=".length);
  const expectedBuf = Buffer.from(expected, "hex");
  const providedBuf = Buffer.from(provided, "hex");
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

/** Marks the inbound message read and shows the "typing…" indicator while RAG runs. */
export async function markReadWithTyping(config: WhatsappConfig, messageId: string): Promise<void> {
  try {
    await fetch(`${GRAPH_API}/${config.phoneNumberId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.accessToken}` },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
        typing_indicator: { type: "text" },
      }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // Best-effort UX signal — a failure here shouldn't block the actual reply.
  }
}

export async function sendWhatsappText(config: WhatsappConfig, to: string, body: string): Promise<void> {
  const res = await fetch(`${GRAPH_API}/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.accessToken}` },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`WhatsApp send failed (${res.status}): ${text.slice(0, 300)}`);
  }
}

export interface WhatsappInboundMessage {
  phoneNumberId: string;
  from: string;
  messageId: string;
  type: string;
  text: string | null;
}

/** Parses a Meta Cloud API webhook payload; returns null for non-message events (status updates, etc). */
export function parseWhatsappWebhook(payload: unknown): WhatsappInboundMessage | null {
  const entry = (payload as { entry?: unknown[] })?.entry?.[0] as
    | { changes?: Array<{ value?: Record<string, unknown> }> }
    | undefined;
  const value = entry?.changes?.[0]?.value as
    | {
        metadata?: { phone_number_id?: string };
        messages?: Array<{ from: string; id: string; type: string; text?: { body: string } }>;
      }
    | undefined;
  const phoneNumberId = value?.metadata?.phone_number_id;
  const message = value?.messages?.[0];
  if (!phoneNumberId || !message) return null;
  return {
    phoneNumberId,
    from: message.from,
    messageId: message.id,
    type: message.type,
    text: message.type === "text" ? (message.text?.body ?? null) : null,
  };
}
