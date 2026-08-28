"use client";

import { FormEvent, Fragment, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { CircleHelp, Trash2, X } from "lucide-react";
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

const HELP_SEEN_KEY = (projectId: string) => `qs-visitor-prompts-help-seen:${projectId}`;

const CONDITION_LABELS: Record<ConditionType, string> = {
  time_on_page: "Stayed on page for…",
  url_match: "On a specific page (URL contains…)",
  exit_intent: "About to leave the site",
  scroll_depth: "Scrolled down the page",
  idle: "Stopped interacting for…",
};

const CONDITION_HINTS: Record<ConditionType, string> = {
  time_on_page: "How many seconds they have been on the current page.",
  url_match: "Match part of the path, e.g. /pricing or /docs — any page that contains this text.",
  exit_intent: "Mouse moves toward the browser tab or back button (desktop). On mobile, a fast scroll up near the top.",
  scroll_depth: "How far down the page they scrolled, as a percentage (1–100).",
  idle: "No mouse, keyboard, or scroll activity for this many seconds.",
};

const USE_CASE_EXAMPLES: {
  title: string;
  description: string;
  message: string;
  conditions: ConditionDraft[];
}[] = [
  {
    title: "Pricing page help",
    description: "Someone reads your pricing page for a bit — offer to compare plans.",
    message: "Questions about plans? I can help you pick the right one.",
    conditions: [
      { type: "url_match", seconds: 20, pattern: "/pricing", percent: 50 },
      { type: "time_on_page", seconds: 15, pattern: "/pricing", percent: 50 },
    ],
  },
  {
    title: "Before they leave",
    description: "Catch visitors who are about to close the tab.",
    message: "Before you go — is there anything I can help with?",
    conditions: [{ type: "exit_intent", seconds: 20, pattern: "/pricing", percent: 50 }],
  },
  {
    title: "Deep on a long page",
    description: "They scrolled far down docs or a blog — they may need setup help.",
    message: "Want help getting started? I can walk you through it.",
    conditions: [{ type: "scroll_depth", seconds: 20, pattern: "/pricing", percent: 60 }],
  },
];

function newCondition(): ConditionDraft {
  return { type: "time_on_page", seconds: 20, pattern: "/pricing", percent: 50 };
}

function conditionSummary(c: ConditionDraft): string {
  switch (c.type) {
    case "time_on_page":
      return `stayed ${c.seconds}s on the page`;
    case "idle":
      return `inactive for ${c.seconds}s`;
    case "url_match":
      return `on a page containing "${c.pattern}"`;
    case "scroll_depth":
      return `scrolled past ${c.percent}%`;
    case "exit_intent":
      return "about to leave";
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
  const [helpOpen, setHelpOpen] = useState(false);

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

  useEffect(() => {
    try {
      if (localStorage.getItem(HELP_SEEN_KEY(id)) !== "1") {
        setHelpOpen(true);
      }
    } catch {
      setHelpOpen(true);
    }
  }, [id]);

  function closeHelp(markSeen = true) {
    setHelpOpen(false);
    if (markSeen) {
      try {
        localStorage.setItem(HELP_SEEN_KEY(id), "1");
      } catch {
        /* ignore */
      }
    }
  }

  function applyExample(example: (typeof USE_CASE_EXAMPLES)[number]) {
    setMessage(example.message);
    setConditions(example.conditions.map((c) => ({ ...c })));
    setShowForm(true);
    setMsg("");
    closeHelp();
  }

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
      setMsg("Add the message visitors will see when chat opens.");
      return;
    }
    const rule: TriggerRule = { id: ruleId(), message: message.trim(), enabled: true, conditions };
    await persist({ maxFiresPerDay, rules: [...rules, rule] });
    setShowForm(false);
    setMessage("");
    setConditions([newCondition()]);
  }

  async function removeRule(ruleIdToRemove: string) {
    if (!confirm("Delete this prompt?")) return;
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
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-sans text-2xl font-bold text-ink md:text-3xl">Visitor prompts</h1>
          <p className="mt-2 text-sm leading-relaxed text-mute">
            Auto-open chat when a visitor matches your conditions, with a custom opening message.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="mt-1 shrink-0 rounded-xl border border-ink/10 p-2.5 text-mute transition hover:border-ink/20 hover:bg-clay hover:text-ink"
          aria-label="How visitor prompts work"
        >
          <CircleHelp className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>

      {msg && <p className="mt-4 text-sm text-mute">{msg}</p>}

      <div className="mt-6 space-y-4">
        <DashPanel>
          <div>
            <label className="text-sm font-medium text-ink">Limit how often chat auto-opens</label>
            <p className="mt-1 text-xs leading-relaxed text-mute">
              Max times per visitor per day that any prompt can open chat. Each prompt still fires
              once per visit.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <DashField
                type="number"
                min={1}
                max={50}
                value={maxFiresPerDay}
                onChange={(e) => setMaxFiresPerDay(Number(e.target.value) || 1)}
                onBlur={() => persist({ maxFiresPerDay, rules })}
                className="max-w-[100px]"
                aria-label="Max auto-opens per visitor per day"
              />
              <span className="text-sm text-mute">times per visitor per day</span>
            </div>
          </div>
        </DashPanel>

        <DashPanel>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-ink">Your prompts</p>
              <p className="mt-0.5 text-xs text-mute">Active wherever your widget is embedded.</p>
            </div>
            {!showForm && (
              <DashBtn type="button" variant="ghost" onClick={() => setShowForm(true)}>
                Add prompt
              </DashBtn>
            )}
          </div>

          {showForm && (
            <form onSubmit={createRule} className="mt-4 space-y-4 border-b border-ink/[0.06] pb-4">
              <div>
                <label className="text-sm font-medium text-ink">Opening message</label>
                <p className="mt-0.5 text-xs text-mute">
                  Shown when chat opens. If they reply, this becomes their first message.
                </p>
                <DashTextarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Need help choosing a plan? I can compare them for you."
                  rows={2}
                  className="mt-1.5"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-ink">When should chat open?</label>
                  <p className="mt-0.5 text-xs text-mute">
                    Add one or more conditions — the visitor must match every one.
                  </p>
                </div>
                {conditions.map((c, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-ink/[0.08] bg-clay/30 p-3 space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <select
                        value={c.type}
                        onChange={(e) => updateCondition(i, { type: e.target.value as ConditionType })}
                        className={selectClass}
                        aria-label={`Condition ${i + 1} type`}
                      >
                        {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>

                      {(c.type === "time_on_page" || c.type === "idle") && (
                        <div className="flex shrink-0 items-center gap-1.5">
                          <DashField
                            type="number"
                            min={1}
                            max={3600}
                            value={c.seconds}
                            onChange={(e) =>
                              updateCondition(i, { seconds: Number(e.target.value) || 1 })
                            }
                            className="max-w-[80px]"
                            aria-label="Seconds"
                          />
                          <span className="text-xs text-mute">sec</span>
                        </div>
                      )}
                      {c.type === "url_match" && (
                        <DashField
                          value={c.pattern}
                          onChange={(e) => updateCondition(i, { pattern: e.target.value })}
                          placeholder="/pricing"
                          aria-label="URL path contains"
                        />
                      )}
                      {c.type === "scroll_depth" && (
                        <div className="flex shrink-0 items-center gap-1.5">
                          <DashField
                            type="number"
                            min={1}
                            max={100}
                            value={c.percent}
                            onChange={(e) =>
                              updateCondition(i, { percent: Number(e.target.value) || 1 })
                            }
                            className="max-w-[80px]"
                            aria-label="Scroll percent"
                          />
                          <span className="text-xs text-mute">%</span>
                        </div>
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
                    <p className="text-xs text-mute">{CONDITION_HINTS[c.type]}</p>
                  </div>
                ))}
                {conditions.length < 5 && (
                  <DashBtn
                    type="button"
                    variant="ghost"
                    onClick={() => setConditions((cs) => [...cs, newCondition()])}
                  >
                    + Add another condition
                  </DashBtn>
                )}
              </div>

              <div className="flex gap-2">
                <DashBtn type="submit" disabled={busy}>
                  {busy ? "Saving…" : "Save prompt"}
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
            <div className="mt-4 rounded-xl border border-dashed border-ink/15 bg-clay/30 px-4 py-6 text-center">
              <p className="text-sm font-medium text-ink">No prompts yet</p>
              <p className="mt-1 text-sm text-mute">
                Add your first prompt, or open the{" "}
                <button
                  type="button"
                  onClick={() => setHelpOpen(true)}
                  className="text-ink underline underline-offset-2 hover:no-underline"
                >
                  help guide
                </button>{" "}
                for examples.
              </p>
            </div>
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
                      Opens when: {r.conditions.map(conditionSummary).join(" and ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={r.enabled}
                      aria-label={r.enabled ? "Disable prompt" : "Enable prompt"}
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
                      aria-label="Delete prompt"
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

      <Transition show={helpOpen} as={Fragment}>
        <Dialog onClose={() => closeHelp()} className="relative z-50">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-ink/40 backdrop-blur-[2px]" aria-hidden="true" />
          </TransitionChild>

          <div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:scale-95"
            >
              <DialogPanel className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-soft">
                <div className="flex items-start justify-between gap-3 border-b border-ink/[0.06] px-5 py-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
                      Visitor prompts
                    </p>
                    <DialogTitle className="mt-1 font-sans text-lg font-bold text-ink">
                      How it works
                    </DialogTitle>
                  </div>
                  <button
                    type="button"
                    onClick={() => closeHelp()}
                    className="rounded-lg p-2 text-mute transition hover:bg-clay hover:text-ink"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>

                <div className="overflow-y-auto px-5 py-4">
                  <p className="text-sm leading-relaxed text-mute">
                    Automatically open the chat widget when a visitor meets your conditions, with a
                    custom opening message. Not the same as{" "}
                    <span className="text-ink">Custom events</span>, which alert your team.
                  </p>

                  <ol className="mt-4 list-inside list-decimal space-y-1.5 text-sm text-mute">
                    <li>Visitor browses your site with the widget installed.</li>
                    <li>They match your conditions (page, time, scroll, etc.).</li>
                    <li>Chat opens with your message — they can reply or ignore it.</li>
                  </ol>

                  <p className="mt-3 text-xs text-mute">
                    Combined conditions must{" "}
                    <span className="text-ink">all</span> be true (e.g. on{" "}
                    <span className="font-mono text-ink">/pricing</span> and stayed 15 seconds).
                  </p>

                  <div className="mt-6">
                    <p className="text-sm font-medium text-ink">Try an example</p>
                    <p className="mt-1 text-xs text-mute">
                      Pre-fills the form — edit before saving.
                    </p>
                    <div className="mt-3 space-y-2">
                      {USE_CASE_EXAMPLES.map((ex) => (
                        <button
                          key={ex.title}
                          type="button"
                          onClick={() => applyExample(ex)}
                          className="w-full rounded-xl border border-ink/[0.08] bg-clay/40 px-4 py-3 text-left transition hover:bg-clay"
                        >
                          <p className="text-sm font-medium text-ink">{ex.title}</p>
                          <p className="mt-0.5 text-xs text-mute">{ex.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-ink/[0.06] px-5 py-4">
                  <DashBtn type="button" className="w-full" onClick={() => closeHelp()}>
                    Got it
                  </DashBtn>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
