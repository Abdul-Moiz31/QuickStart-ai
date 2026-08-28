"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Trash2 } from "lucide-react";
import { api, getStoredToken } from "@/lib/api";
import { DashBtn, DashField, DashPanel, DashTextarea } from "@/components/dashboard/DashboardShell";

type ConditionType = "time_on_page" | "url_match" | "exit_intent" | "scroll_depth" | "idle";

interface ConditionDraft {
  type: ConditionType;
  seconds: number;
  pattern: string;
  percent: number;
}

interface TriggerRule {
  id: string;
  message: string;
  enabled: boolean;
  conditions: ConditionDraft[];
}

interface ProactiveTriggersConfig {
  maxFiresPerDay: number;
  rules: TriggerRule[];
}

const CONDITION_LABELS: Record<ConditionType, string> = {
  time_on_page: "Time on page",
  url_match: "URL matches",
  exit_intent: "Exit intent",
  scroll_depth: "Scroll depth",
  idle: "Idle time",
};

function newCondition(): ConditionDraft {
  return { type: "time_on_page", seconds: 20, pattern: "/pricing", percent: 50 };
}

function conditionSummary(c: ConditionDraft): string {
  switch (c.type) {
    case "time_on_page":
      return `on the page for ${c.seconds}s`;
    case "idle":
      return `idle for ${c.seconds}s`;
    case "url_match":
      return `URL matches "${c.pattern}"`;
    case "scroll_depth":
      return `scrolled past ${c.percent}%`;
    case "exit_intent":
      return "about to leave (exit intent)";
  }
}

/** Strips the UI-only fields each condition carries so the payload matches the API schema. */
function toApiCondition(c: ConditionDraft) {
  switch (c.type) {
    case "time_on_page":
    case "idle":
      return { type: c.type, seconds: c.seconds };
    case "url_match":
      return { type: c.type, pattern: c.pattern };
    case "scroll_depth":
      return { type: c.type, percent: c.percent };
    case "exit_intent":
      return { type: c.type };
  }
}

function fromApiCondition(c: Record<string, unknown>): ConditionDraft {
  const base = newCondition();
  return {
    ...base,
    type: c.type as ConditionType,
    seconds: typeof c.seconds === "number" ? c.seconds : base.seconds,
    pattern: typeof c.pattern === "string" ? c.pattern : base.pattern,
    percent: typeof c.percent === "number" ? c.percent : base.percent,
  };
}

function ruleId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `rule-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const selectClass =
  "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40";

export default function TriggersPage() {
  const { id } = useParams<{ id: string }>();
  const [maxFiresPerDay, setMaxFiresPerDay] = useState(3);
  const [rules, setRules] = useState<TriggerRule[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [message, setMessage] = useState("");
  const [conditions, setConditions] = useState<ConditionDraft[]>([newCondition()]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api<{
      project: { proactiveTriggers?: { maxFiresPerDay?: number; rules?: Record<string, unknown>[] } };
    }>(`/api/v1/projects/${id}`, { token }).then((res) => {
      const cfg = res.project.proactiveTriggers;
      setMaxFiresPerDay(cfg?.maxFiresPerDay ?? 3);
      setRules(
        (cfg?.rules ?? []).map((r) => ({
          id: (r.id as string) ?? ruleId(),
          message: (r.message as string) ?? "",
          enabled: r.enabled !== false,
          conditions: ((r.conditions as Record<string, unknown>[]) ?? []).map(fromApiCondition),
        })),
      );
    });
  }, [id]);

  async function persist(next: ProactiveTriggersConfig) {
    const token = getStoredToken();
    if (!token) return;
    setBusy(true);
    try {
      await api(`/api/v1/projects/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          proactiveTriggers: {
            maxFiresPerDay: next.maxFiresPerDay,
            rules: next.rules.map((r) => ({
              id: r.id,
              message: r.message,
              enabled: r.enabled,
              conditions: r.conditions.map(toApiCondition),
            })),
          },
        }),
      });
      setMaxFiresPerDay(next.maxFiresPerDay);
      setRules(next.rules);
      setMsg("Saved");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function createRule(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setMsg("Enter a message");
      return;
    }
    const rule: TriggerRule = { id: ruleId(), message: message.trim(), enabled: true, conditions };
    await persist({ maxFiresPerDay, rules: [...rules, rule] });
    setShowForm(false);
    setMessage("");
    setConditions([newCondition()]);
  }

  async function removeRule(ruleIdToRemove: string) {
    if (!confirm("Delete this trigger?")) return;
    await persist({ maxFiresPerDay, rules: rules.filter((r) => r.id !== ruleIdToRemove) });
  }

  async function toggleRule(ruleIdToToggle: string, enabled: boolean) {
    await persist({
      maxFiresPerDay,
      rules: rules.map((r) => (r.id === ruleIdToToggle ? { ...r, enabled } : r)),
    });
  }

  function updateCondition(index: number, patch: Partial<ConditionDraft>) {
    setConditions((cs) => cs.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
      <h1 className="font-sans text-2xl font-bold text-ink md:text-3xl">Proactive triggers</h1>
      <p className="mt-2 text-sm text-mute">
        Auto-open the widget and send an opening message when a visitor meets a condition — time
        on a page, exit intent, scroll depth, and more. Combine conditions with AND (e.g. on{" "}
        <span className="text-ink">/pricing</span> AND after 15 seconds).
      </p>

      {msg && <p className="mt-4 text-sm text-mute">{msg}</p>}

      <div className="mt-6 space-y-4">
        <DashPanel>
          <div>
            <label className="text-sm font-medium text-ink">Daily cap per visitor</label>
            <p className="mt-0.5 text-xs text-mute">
              Total proactive fires per visitor per day, across all triggers below.
            </p>
            <DashField
              type="number"
              min={1}
              max={50}
              value={maxFiresPerDay}
              onChange={(e) => setMaxFiresPerDay(Number(e.target.value) || 1)}
              onBlur={() => persist({ maxFiresPerDay, rules })}
              className="mt-1.5 max-w-[160px]"
            />
          </div>
        </DashPanel>

        <DashPanel>
          <div className="flex items-center justify-between gap-4">
            <p className="font-medium text-ink">Triggers</p>
            {!showForm && (
              <DashBtn type="button" variant="ghost" onClick={() => setShowForm(true)}>
                Add trigger
              </DashBtn>
            )}
          </div>

          {showForm && (
            <form onSubmit={createRule} className="mt-4 space-y-4 border-b border-ink/[0.06] pb-4">
              <div>
                <label className="text-sm font-medium text-ink">Opening message</label>
                <DashTextarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Need help choosing a plan? I can compare them for you."
                  rows={2}
                  className="mt-1.5"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-ink">Conditions (all must hold)</label>
                {conditions.map((c, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <select
                      value={c.type}
                      onChange={(e) => updateCondition(i, { type: e.target.value as ConditionType })}
                      className={selectClass}
                    >
                      {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>

                    {(c.type === "time_on_page" || c.type === "idle") && (
                      <DashField
                        type="number"
                        min={1}
                        max={3600}
                        value={c.seconds}
                        onChange={(e) => updateCondition(i, { seconds: Number(e.target.value) || 1 })}
                        placeholder="Seconds"
                        className="max-w-[140px]"
                      />
                    )}
                    {c.type === "url_match" && (
                      <DashField
                        value={c.pattern}
                        onChange={(e) => updateCondition(i, { pattern: e.target.value })}
                        placeholder="/pricing"
                      />
                    )}
                    {c.type === "scroll_depth" && (
                      <DashField
                        type="number"
                        min={1}
                        max={100}
                        value={c.percent}
                        onChange={(e) => updateCondition(i, { percent: Number(e.target.value) || 1 })}
                        placeholder="Percent"
                        className="max-w-[140px]"
                      />
                    )}

                    {conditions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setConditions((cs) => cs.filter((_, idx) => idx !== i))}
                        className="shrink-0 rounded-lg border border-ink/10 p-3 text-mute hover:text-red-600"
                        aria-label="Remove condition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {conditions.length < 5 && (
                  <DashBtn
                    type="button"
                    variant="ghost"
                    onClick={() => setConditions((cs) => [...cs, newCondition()])}
                  >
                    + Add condition (AND)
                  </DashBtn>
                )}
              </div>

              <div className="flex gap-2">
                <DashBtn type="submit" disabled={busy}>
                  {busy ? "Saving…" : "Create"}
                </DashBtn>
                <DashBtn
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowForm(false);
                    setMessage("");
                    setConditions([newCondition()]);
                  }}
                >
                  Cancel
                </DashBtn>
              </div>
            </form>
          )}

          {rules.length === 0 ? (
            <p className="mt-4 text-sm text-mute">No proactive triggers yet.</p>
          ) : (
            <div className="mt-4">
              {rules.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start justify-between gap-4 border-t border-ink/[0.06] py-4 first:border-t-0 first:pt-0"
                >
                  <div>
                    <p className="font-medium text-ink">{r.message}</p>
                    <p className="mt-1 text-xs text-mute">
                      {r.conditions.map(conditionSummary).join(" AND ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={r.enabled}
                      onClick={() => toggleRule(r.id, !r.enabled)}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                        r.enabled ? "bg-black" : "bg-ink/15"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                          r.enabled ? "left-5" : "left-0.5"
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRule(r.id)}
                      className="rounded-lg border border-ink/10 p-2 text-mute hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashPanel>
      </div>
    </div>
  );
}
