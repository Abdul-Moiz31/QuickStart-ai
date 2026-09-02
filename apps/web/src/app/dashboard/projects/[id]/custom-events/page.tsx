"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { api, getStoredToken } from "@/lib/api";
import { DashBtn, DashField, DashPanel, DashTextarea } from "@/components/dashboard/DashboardShell";
import {
  BuiltInEventsList,
  HelpDetails,
  slugifyAlertName,
} from "@/components/integrations/IntegrationsSections";

interface CatalogEntry {
  type: string;
  name: string;
  description: string;
  category: string;
}

interface EventRuleRow {
  id: string;
  name: string;
  description: string;
  triggers: { type: string; keywords?: string[] };
}

export default function CustomEventsPage() {
  const { id } = useParams<{ id: string }>();
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [rules, setRules] = useState<EventRuleRow[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");

  const load = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    const [cat, rl] = await Promise.all([
      api<{ catalog: CatalogEntry[] }>(`/api/v1/projects/${id}/integrations/catalog`, { token }),
      api<{ rules: EventRuleRow[] }>(`/api/v1/projects/${id}/event-rules`, { token }),
    ]);
    setCatalog(cat.catalog);
    setRules(rl.rules);
  }, [id]);

  useEffect(() => {
    load().catch(() => setMsg("Could not load"));
  }, [load]);

  async function createRule(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken();
    if (!token) return;
    const slug = slugifyAlertName(name);
    if (!slug) {
      setMsg("Enter a name");
      return;
    }
    setBusy(true);
    try {
      await api(`/api/v1/projects/${id}/event-rules`, {
        method: "POST",
        token,
        body: JSON.stringify({
          name,
          description,
          eventType: `custom.${slug}`,
          triggers: {
            type: "keyword",
            keywords: keywords.split(",").map((s) => s.trim()).filter(Boolean),
          },
          destinations: [],
        }),
      });
      setShowForm(false);
      setName("");
      setDescription("");
      setKeywords("");
      await load();
      setMsg("Created — enable it on a connection in Notifications.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not create");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
      <h1 className="qs-h1">Custom events</h1>
      <p className="mt-2 text-sm text-mute">
        Alert on specific keywords. Deliver via{" "}
        <Link href={`/dashboard/projects/${id}/notifications`} className="text-ink underline underline-offset-2">
          Notifications
        </Link>
        . Leads and handoffs are automatic — enable them in{" "}
        <Link href={`/dashboard/projects/${id}/tools`} className="text-ink underline underline-offset-2">
          Tools
        </Link>
        .
      </p>

      {msg && <p className="mt-4 text-sm text-mute">{msg}</p>}

      <div className="mt-6 space-y-4">
        <DashPanel>
          <div className="flex items-center justify-between gap-4">
            <p className="font-medium text-ink">Keyword events</p>
            {!showForm && (
              <DashBtn type="button" variant="ghost" onClick={() => setShowForm(true)}>
                Add event
              </DashBtn>
            )}
          </div>

          {showForm && (
            <form onSubmit={createRule} className="mt-4 space-y-4 border-b border-ink/[0.06] pb-4">
              <HelpDetails title="Example">
                <p>
                  Name: <span className="text-ink">Pricing question</span> · Keywords:{" "}
                  <span className="text-ink">pricing, cost, quote</span>
                </p>
              </HelpDetails>

              <div>
                <label className="text-sm font-medium text-ink">Name</label>
                <DashField
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Pricing question"
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink">Description</label>
                <DashTextarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Visitor asks about plans or cost"
                  rows={2}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink">Keywords</label>
                <p className="mt-0.5 text-xs text-mute">Comma-separated, not case-sensitive.</p>
                <DashField
                  required
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="pricing, demo, quote"
                  className="mt-1.5"
                />
              </div>
              <div className="flex gap-2">
                <DashBtn type="submit" disabled={busy}>
                  {busy ? "Saving…" : "Create"}
                </DashBtn>
                <DashBtn type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </DashBtn>
              </div>
            </form>
          )}

          {rules.length === 0 ? (
            <p className="mt-4 text-sm text-mute">No custom events yet.</p>
          ) : (
            <div className={showForm ? "mt-4" : "mt-4"}>
              {rules.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start justify-between gap-4 border-t border-ink/[0.06] py-4 first:border-t-0 first:pt-0"
                >
                  <div>
                    <p className="font-medium text-ink">{r.name}</p>
                    <p className="mt-1 text-sm text-mute">{r.description}</p>
                    {r.triggers.keywords?.length ? (
                      <p className="mt-1 text-xs text-mute">{r.triggers.keywords.join(", ")}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const token = getStoredToken();
                      if (!token || !confirm("Delete?")) return;
                      await api(`/api/v1/projects/${id}/event-rules/${r.id}`, {
                        method: "DELETE",
                        token,
                      });
                      await load();
                    }}
                    className="shrink-0 rounded-lg border border-ink/10 p-2 text-mute hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </DashPanel>

        <HelpDetails title="Built-in detection (automatic)">
          <BuiltInEventsList catalog={catalog} />
        </HelpDetails>
      </div>
    </div>
  );
}
