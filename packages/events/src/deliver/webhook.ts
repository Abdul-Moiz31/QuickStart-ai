import { signWebhookPayload } from "../sign.js";
import type { EventEnvelope } from "../types.js";

export async function postWebhook(
  url: string,
  secret: string,
  envelope: EventEnvelope,
  deliveryId: string,
): Promise<number> {
  const body = JSON.stringify(envelope);
  const signature = signWebhookPayload(secret, body);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "QuickStart-Webhook/1.0",
      "X-QuickStart-Event": envelope.type,
      "X-QuickStart-Delivery-Id": deliveryId,
      "X-QuickStart-Signature": signature,
    },
    body,
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Webhook failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.status;
}

export const RETRY_DELAYS_MS = [0, 60_000, 300_000, 1_800_000, 7_200_000];

export function nextRetryDelay(attempts: number): number | null {
  const idx = attempts;
  if (idx >= RETRY_DELAYS_MS.length) return null;
  return RETRY_DELAYS_MS[idx] ?? null;
}
