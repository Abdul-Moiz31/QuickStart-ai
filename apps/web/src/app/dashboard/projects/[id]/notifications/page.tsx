"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Check, Copy, Trash2 } from "lucide-react";
import { api, getStoredToken } from "@/lib/api";
import { DashBtn, DashField, DashPanel } from "@/components/dashboard/DashboardShell";
import { AlertTypePicker, HelpDetails } from "@/components/integrations/IntegrationsSections";

type ConnectionKind = "slack" | "discord" | "webhook" | null;

interface CatalogEntry {
  type: string;
  name: string;
  description: string;
  category: string;
}

interface WebhookRow {
  id: string;
  label: string;
  url: string;
  events: string[];
}

interface IntegrationRow {
  id: string;
  provider: string;
  label: string;
  events: string[];
}

interface EventRuleRow {
  id: string;
  eventType: string;
  name: string;
  description: string;
}

const CONNECTION_OPTIONS: Array<{ kind: ConnectionKind; label: string; hint: string }> = [
  { kind: "slack", label: "Slack", hint: "Post to a channel" },
  { kind: "discord", label: "Discord", hint: "Post to a server channel" },
  { kind: "webhook", label: "Webhook", hint: "Zapier, CRM, your server" },
];

const SETUP_STEPS: Record<string, string[]> = {
  slack: [
    "Slack → Apps → Incoming Webhooks → Add to channel.",
    "Copy the webhook URL and paste it below.",
  ],
  discord: [
    "Channel settings → Integrations → Webhooks → New Webhook.",
    "Copy the URL and paste it below.",
  ],
  webhook: [
    "Use any HTTPS endpoint that accepts POST requests.",
    "After saving, click Test to verify delivery.",
  ],
};

const PROVIDER_LABEL: Record<string, string> = {
  slack: "Slack",
  discord: "Discord",
};

export default function NotificationsPage() {
  const { id } = useParams<{ id: string }>();
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
  const [rules, setRules] = useState<EventRuleRow[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState<ConnectionKind>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "lead.captured",
    "human.handoff.requested",
  ]);

  const load = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    const [cat, wh, integ, rl] = await Promise.all([
      api<{ catalog: CatalogEntry[] }>(`/api/v1/projects/${id}/integrations/catalog`, { token }),
      api<{ webhooks: WebhookRow[] }>(`/api/v1/projects/${id}/webhooks`, { token }),
      api<{ integrations: IntegrationRow[] }>(`/api/v1/projects/${id}/integrations`, { token }),
      api<{ rules: EventRuleRow[] }>(`/api/v1/projects/${id}/event-rules`, { token }),
    ]);
    setCatalog(cat.catalog);
    setWebhooks(wh.webhooks);
    setIntegrations(integ.integrations);
    setRules(rl.rules);
  }, [id]);

  useEffect(() => {
    load().catch(() => setMsg("Could not load notifications"));
  }, [load]);

  function startAdd(kind: ConnectionKind) {
    setAdding(kind);
    setLabel(
      kind === "slack" ? "Team Slack" : kind === "discord" ? "Support Discord" : "My app",
    );
    setUrl("");
  }

  async function submitConnection(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken();
    if (!token || !adding) return;
    setBusy(true);
    setMsg("");
    try {
      if (adding === "webhook") {
        const res = await api<{ webhook: { secret?: string } }>(
          `/api/v1/projects/${id}/webhooks`,
          {
            method: "POST",
            token,
            body: JSON.stringify({ label, url, events: selectedEvents }),
          },
        );
        if (res.webhook.secret) setNewSecret(res.webhook.secret);
      } else {
        await api(`/api/v1/projects/${id}/integrations/${adding}`, {
          method: "POST",
          token,
          body: JSON.stringify({ label, webhookUrl: url, events: selectedEvents }),
        });
      }
      setAdding(null);
      setLabel("");
      setUrl("");
      await load();
      setMsg("Saved — use Test to verify.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function testConnection(type: "webhook" | "integration", targetId: string) {
    const token = getStoredToken();
    if (!token) return;
    setBusy(true);
    try {
      const path =
        type === "webhook"
          ? `/api/v1/projects/${id}/webhooks/${targetId}/test`
          : `/api/v1/projects/${id}/integrations/${targetId}/test`;
      await api(path, { method: "POST", token });
      setMsg("Test sent.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Test failed");
    } finally {
      setBusy(false);
    }
  }

  const hasConnections = webhooks.length + integrations.length > 0;
  const addingLabel =
    adding === "slack" ? "Slack" : adding === "discord" ? "Discord" : "Webhook";

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
      <h1 className="font-sans text-2xl font-bold text-ink md:text-3xl">Notifications</h1>
      <p className="mt-2 text-sm text-mute">
        Connect Slack, Discord, or a webhook. Keyword triggers live in{" "}
        <Link href={`/dashboard/projects/${id}/custom-events`} className="text-ink underline underline-offset-2">
          Custom events
        </Link>
        .
      </p>

      {msg && <p className="mt-4 text-sm text-mute">{msg}</p>}

      {newSecret && (
        <DashPanel className="mt-4">
          <p className="text-sm font-medium text-ink">Webhook secret — copy now</p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg bg-clay px-3 py-2 font-mono text-xs">
              {newSecret}
            </code>
            <button
              type="button"
              className="rounded-lg border border-ink/10 p-2"
              onClick={() => {
                void navigator.clipboard.writeText(newSecret);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <button type="button" className="mt-3 text-sm text-mute underline" onClick={() => setNewSecret(null)}>
            Done
          </button>
        </DashPanel>
      )}

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
                <HelpDetails title="How to get the webhook URL">
                  <ol className="list-decimal space-y-1 pl-4">
                    {(SETUP_STEPS[adding] ?? []).map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </HelpDetails>

                <div>
                  <label className="text-sm font-medium text-ink">Name</label>
                  <DashField
                    required
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-ink">Webhook URL</label>
                  <DashField
                    required
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-ink">Alerts to send</label>
                  <div className="mt-2">
                    <AlertTypePicker
                      catalog={catalog}
                      customRules={rules}
                      selected={selectedEvents}
                      onChange={setSelectedEvents}
                    />
                  </div>
                </div>
                <DashBtn type="submit" disabled={busy}>
                  {busy ? "Saving…" : "Save connection"}
                </DashBtn>
              </form>
            </>
          ) : (
            <>
              <p className="font-medium text-ink">Add connection</p>
              {CONNECTION_OPTIONS.map((opt) => (
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

        {hasConnections && (
          <DashPanel>
            <p className="font-medium text-ink">Active connections</p>
            <div className="mt-2">
              {integrations.map((i) => (
                <div
                  key={i.id}
                  className="flex items-start justify-between gap-4 border-b border-ink/[0.06] py-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-ink">
                      {PROVIDER_LABEL[i.provider] ?? i.provider} · {i.label}
                    </p>
                    <p className="mt-1 text-sm text-mute">{i.events.length} alerts enabled</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <DashBtn type="button" variant="ghost" onClick={() => testConnection("integration", i.id)}>
                      Test
                    </DashBtn>
                    <button
                      type="button"
                      onClick={async () => {
                        const token = getStoredToken();
                        if (!token || !confirm("Remove?")) return;
                        await api(`/api/v1/projects/${id}/integrations/${i.id}`, {
                          method: "DELETE",
                          token,
                        });
                        await load();
                      }}
                      className="rounded-lg border border-ink/10 p-2 text-mute hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {webhooks.map((w) => (
                <div
                  key={w.id}
                  className="flex items-start justify-between gap-4 border-b border-ink/[0.06] py-4 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink">Webhook · {w.label}</p>
                    <p className="mt-1 truncate font-mono text-xs text-mute">{w.url}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <DashBtn type="button" variant="ghost" onClick={() => testConnection("webhook", w.id)}>
                      Test
                    </DashBtn>
                    <button
                      type="button"
                      onClick={async () => {
                        const token = getStoredToken();
                        if (!token || !confirm("Remove?")) return;
                        await api(`/api/v1/projects/${id}/webhooks/${w.id}`, {
                          method: "DELETE",
                          token,
                        });
                        await load();
                      }}
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
