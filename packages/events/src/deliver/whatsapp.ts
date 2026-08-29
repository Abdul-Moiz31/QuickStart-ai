/** Confirms the stored Phone Number ID/access token pair is valid by fetching the number. */
export async function verifyWhatsappCredentials(phoneNumberId: string, accessToken: string): Promise<number> {
  const res = await fetch(
    `https://graph.facebook.com/v20.0/${phoneNumberId}?fields=verified_name`,
    { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10_000) },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`WhatsApp credential check failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.status;
}

/** Confirms the stored Page ID/access token pair is valid by fetching the page. */
export async function verifyInstagramCredentials(pageId: string, pageAccessToken: string): Promise<number> {
  const res = await fetch(
    `https://graph.facebook.com/v20.0/${pageId}?fields=name`,
    { headers: { Authorization: `Bearer ${pageAccessToken}` }, signal: AbortSignal.timeout(10_000) },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Instagram credential check failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.status;
}
