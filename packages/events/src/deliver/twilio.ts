/** Confirms the stored Account SID/Auth Token pair is valid by fetching the account. */
export async function verifyTwilioCredentials(accountSid: string, authToken: string): Promise<number> {
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Twilio credential check failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.status;
}
