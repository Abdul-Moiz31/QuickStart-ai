"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Trash2 } from "lucide-react";
import { api, getStoredToken, resolvePublicApiUrl } from "@/lib/api";
import { DashBtn, DashField, DashPanel } from "@/components/dashboard/DashboardShell";
import { HelpDetails } from "@/components/integrations/IntegrationsSections";

type ChannelKind = "sms" | "whatsapp" | "instagram" | null;

interface ChannelRow {
  id: string;
  provider: string;
  label: string;
  enabled: boolean;
}

const CHANNEL_OPTIONS: Array<{ kind: ChannelKind; label: string; hint: string }> = [
  { kind: "sms", label: "SMS", hint: "Answer texts on a Twilio number" },
  { kind: "whatsapp", label: "WhatsApp", hint: "Answer messages on a WhatsApp Business number" },
  { kind: "instagram", label: "Instagram", hint: "Answer DMs on your Instagram business account" },
];

const CHANNEL_LABEL: Record<string, string> = { sms: "SMS", whatsapp: "WhatsApp", instagram: "Instagram" };

function webhookUrlFor(kind: "sms" | "whatsapp" | "instagram"): string {
  return `${resolvePublicApiUrl()}/api/v1/channels/${kind}`;
}

const SETUP_STEPS: Record<string, string[]> = {
  sms: [
    "Twilio Console → Phone Numbers → your number → Messaging.",
    `Set "A message comes in" to a webhook: paste the URL below.`,
    "Copy your Account SID, Auth Token, and the number itself (E.164, e.g. +15551234567) into the fields below.",
  ],
  whatsapp: [
    "Meta App Dashboard → WhatsApp → Configuration → Webhook.",
    "Paste the URL below as the callback URL, and the Verify Token you choose below.",
    "Copy the Phone Number ID and a System User access token from WhatsApp → API Setup.",
    "Copy the App Secret from App Settings → Basic.",
  ],
  instagram: [
    "Meta App Dashboard → Instagram → Configuration → Webhook.",
    "Paste the URL below as the callback URL, and the Verify Token you choose below.",
    "Copy your Instagram-linked Page ID and a Page access token from Messenger → API Setup (instagram_manage_messages permission).",
    "Copy the App Secret from App Settings → Basic.",
  ],
};

export default function ChannelsPage() {
  const { id } = useParams<{ id: string }>();
  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState<ChannelKind>(null);

  const [label, setLabel] = useState("");
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [fromNumber, setFromNumber] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [verifyToken, setVerifyToken] = useState("");

  const load = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    const res = await api<{ integrations: ChannelRow[] }>(`/api/v1/projects/${id}/integrations`, {
      token,
    });
    setChannels(
      res.integrations.filter(
        (i) => i.provider === "sms" || i.provider === "whatsapp" || i.provider === "instagram",
      ),
    );
  }, [id]);

  useEffect(() => {
    load().catch(() => setMsg("Could not load channels"));
  }, [load]);

  function startAdd(kind: ChannelKind) {
    setAdding(kind);
    setLabel(kind === "sms" ? "SMS" : kind === "whatsapp" ? "WhatsApp" : "Instagram");
    setAccountSid("");
    setAuthToken("");
    setFromNumber("");
    setPhoneNumberId("");
    setAccessToken("");
    setAppSecret("");
    setVerifyToken("");
    setMsg("");
  }

  async function submitConnection(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken();
    if (!token || !adding) return;
    setBusy(true);
    setMsg("");
    try {
      const body =
        adding === "sms"
          ? { label, accountSid, authToken, fromNumber }
          : adding === "whatsapp"
            ? { label, phoneNumberId, accessToken, appSecret, verifyToken }
            : { label, pageId: phoneNumberId, pageAccessToken: accessToken, appSecret, verifyToken };
      await api(`/api/v1/projects/${id}/integrations/${adding}`, {
        method: "POST",
        token,
        body: JSON.stringify(body),
      });
      setAdding(null);
      await load();
      setMsg("Saved — use Test to verify your credentials.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function testConnection(targetId: string) {
    const token = getStoredToken();
    if (!token) return;
    setBusy(true);
    try {
      await api(`/api/v1/projects/${id}/integrations/${targetId}/test`, { method: "POST", token });
      setMsg("Credentials look good.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Test failed — check your credentials");
    } finally {
      setBusy(false);
    }
  }

  async function removeChannel(targetId: string) {
    const token = getStoredToken();
    if (!token || !confirm("Remove this channel?")) return;
    await api(`/api/v1/projects/${id}/integrations/${targetId}`, { method: "DELETE", token });
    await load();
  }

  const addingLabel = adding === "sms" ? "SMS" : "WhatsApp";

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
      <h1 className="font-sans text-2xl font-bold text-ink md:text-3xl">Channels</h1>
      <p className="mt-2 text-sm text-mute">
        Connect your own WhatsApp Business number or Twilio SMS number — your chatbot answers
        messages there using the same knowledge base. You own the number and its cost with
        Meta/Twilio directly; QuickStart only stores your credentials to relay messages.
      </p>

      {msg && <p className="mt-4 text-sm text-mute">{msg}</p>}

      <div className="mt-6 space-y-4">
        <DashPanel>
          {adding ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-ink">Connect {addingLabel}</p>
                <button type="button" className="text-sm text-mute underline" onClick={() => setAdding(null)}>
                  Cancel
                </button>
              </div>

              <form onSubmit={submitConnection} className="mt-4 space-y-4">
                <HelpDetails title={`How to connect ${addingLabel}`}>
                  <ol className="list-decimal space-y-1 pl-4">
                    {(SETUP_STEPS[adding] ?? []).map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </HelpDetails>

                <div>
                  <label className="text-sm font-medium text-ink">Webhook URL</label>
                  <code className="mt-1.5 block overflow-x-auto rounded-lg bg-clay px-3 py-2 font-mono text-xs">
                    {webhookUrlFor(adding)}
                  </code>
                </div>

                <div>
                  <label className="text-sm font-medium text-ink">Name</label>
                  <DashField required value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1.5" />
                </div>

                {adding === "sms" ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-ink">Account SID</label>
                      <DashField
                        required
                        value={accountSid}
                        onChange={(e) => setAccountSid(e.target.value)}
                        placeholder="AC..."
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-ink">Auth Token</label>
                      <DashField
                        required
                        type="password"
                        value={authToken}
                        onChange={(e) => setAuthToken(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-ink">From number</label>
                      <DashField
                        required
                        value={fromNumber}
                        onChange={(e) => setFromNumber(e.target.value)}
                        placeholder="+15551234567"
                        className="mt-1.5"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-ink">
                        {adding === "whatsapp" ? "Phone Number ID" : "Page ID"}
                      </label>
                      <DashField
                        required
                        value={phoneNumberId}
                        onChange={(e) => setPhoneNumberId(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-ink">
                        {adding === "whatsapp" ? "Access token" : "Page access token"}
                      </label>
                      <DashField
                        required
                        type="password"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-ink">App Secret</label>
                      <DashField
                        required
                        type="password"
                        value={appSecret}
                        onChange={(e) => setAppSecret(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-ink">Verify token</label>
                      <DashField
                        required
                        value={verifyToken}
                        onChange={(e) => setVerifyToken(e.target.value)}
                        placeholder="Choose any string — paste the same one into Meta"
                        className="mt-1.5"
                      />
                    </div>
                  </>
                )}

                <DashBtn type="submit" disabled={busy}>
                  {busy ? "Saving…" : "Save connection"}
                </DashBtn>
              </form>
            </>
          ) : (
            <>
              <p className="font-medium text-ink">Add channel</p>
              {CHANNEL_OPTIONS.map((opt) => (
                <div
                  key={opt.kind}
                  className="flex items-center justify-between gap-4 border-b border-ink/[0.06] py-4 first:pt-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-ink">{opt.label}</p>
                    <p className="text-sm text-mute">{opt.hint}</p>
                  </div>
                  <DashBtn type="button" variant="ghost" onClick={() => startAdd(opt.kind)}>
                    Connect
                  </DashBtn>
                </div>
              ))}
            </>
          )}
        </DashPanel>

        {channels.length > 0 && (
          <DashPanel>
            <p className="font-medium text-ink">Active channels</p>
            <div className="mt-2">
              {channels.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start justify-between gap-4 border-b border-ink/[0.06] py-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-ink">
                      {CHANNEL_LABEL[c.provider] ?? c.provider} · {c.label}
                    </p>
                    <p className="mt-1 text-sm text-mute">{c.enabled ? "Enabled" : "Disabled"}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <DashBtn type="button" variant="ghost" onClick={() => testConnection(c.id)}>
                      Test
                    </DashBtn>
                    <button
                      type="button"
                      onClick={() => removeChannel(c.id)}
                      className="rounded-lg border border-ink/10 p-2 text-mute hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </DashPanel>
        )}
      </div>
    </div>
  );
}
