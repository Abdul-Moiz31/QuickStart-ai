const GRAPH_API = "https://graph.facebook.com/v20.0";

export interface InstagramConfig {
  pageId: string;
  pageAccessToken: string;
  appSecret: string;
  verifyToken: string;
}

export interface InstagramInboundMessage {
  pageId: string;
  from: string;
  text: string | null;
}

/** Parses a Messenger Platform webhook payload for Instagram; null for non-message events. */
export function parseInstagramWebhook(payload: unknown): InstagramInboundMessage | null {
  const entry = (payload as { entry?: unknown[] })?.entry?.[0] as
    | { id?: string; messaging?: Array<{ sender?: { id?: string }; message?: { text?: string; is_echo?: boolean } }> }
    | undefined;
  const pageId = entry?.id;
  const messaging = entry?.messaging?.[0];
  const senderId = messaging?.sender?.id;
  if (!pageId || !senderId || !messaging?.message || messaging.message.is_echo) return null;
  return {
    pageId,
    from: senderId,
    text: messaging.message.text ?? null,
  };
}

export async function sendInstagramText(config: InstagramConfig, to: string, body: string): Promise<void> {
  const url = `${GRAPH_API}/me/messages?access_token=${encodeURIComponent(config.pageAccessToken)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: to },
      messaging_type: "RESPONSE",
      message: { text: body },
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Instagram send failed (${res.status}): ${text.slice(0, 300)}`);
  }
}
