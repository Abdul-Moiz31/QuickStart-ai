"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GEMINI_VOICE_NAMES } from "@quickstart-ai/shared";
import { api, getStoredToken } from "@/lib/api";
import { DashBtn, DashField, DashPanel } from "@/components/dashboard/DashboardShell";

function VoiceToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink/[0.06] py-4 last:border-0 last:pb-0 first:pt-0">
      <div>
        <p className="font-medium text-ink">{label}</p>
        <p className="mt-1 text-sm text-mute">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-ink" : "bg-ink/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${
            checked ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function VoicePage() {
  const { id } = useParams<{ id: string }>();
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceName, setVoiceName] = useState("Puck");
  const [voiceLanguage, setVoiceLanguage] = useState("en");
  const [voiceInstructionsExtra, setVoiceInstructionsExtra] = useState("");
  const [voiceFallbackMode, setVoiceFallbackMode] = useState<"transcribe" | "text_only">(
    "transcribe",
  );
  const [minutesUsed, setMinutesUsed] = useState(0);
  const [minutesLimit, setMinutesLimit] = useState(0);
  const [activeSessions, setActiveSessions] = useState(0);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;

    const [projectRes, usageRes] = await Promise.all([
      api<{
        project: {
          voiceEnabled?: boolean;
          voiceName?: string;
          voiceLanguage?: string;
          voiceInstructionsExtra?: string | null;
          voiceFallbackMode?: string;
        };
      }>(`/api/v1/projects/${id}`, { token }),
      api<{
        usage: {
          minutesUsed: number;
          minutesLimit: number;
          activeSessions: number;
        };
      }>(`/api/v1/projects/${id}/voice/usage`, { token }).catch(() => null),
    ]);

    const p = projectRes.project;
    setVoiceEnabled(Boolean(p.voiceEnabled));
    setVoiceName(p.voiceName ?? "Puck");
    setVoiceLanguage(p.voiceLanguage ?? "en");
    setVoiceInstructionsExtra(p.voiceInstructionsExtra ?? "");
    setVoiceFallbackMode(p.voiceFallbackMode === "text_only" ? "text_only" : "transcribe");

    if (usageRes) {
      setMinutesUsed(usageRes.usage.minutesUsed);
      setMinutesLimit(usageRes.usage.minutesLimit);
      setActiveSessions(usageRes.usage.activeSessions);
    }
  }, [id]);

  useEffect(() => {
    load().catch(() => setMsg("Could not load voice settings"));
  }, [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken();
    if (!token) return;
    setBusy(true);
    setMsg("");
    try {
      await api(`/api/v1/projects/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          voiceEnabled,
          voiceName,
          voiceLanguage,
          voiceInstructionsExtra: voiceInstructionsExtra.trim() || undefined,
          voiceFallbackMode,
        }),
      });
      setMsg("Voice settings saved.");
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
      <h1 className="qs-h1">Voice</h1>
      <p className="mt-2 text-sm text-mute">
        Realtime voice chat powered by Google Gemini Live. Visitors speak naturally in the widget;
        answers use your project knowledge and tools.
      </p>

      {msg && <p className="mt-4 text-sm text-mute">{msg}</p>}

      <DashPanel className="mt-6">
        <p className="font-medium text-ink">Usage this month</p>
        <p className="mt-1 text-sm text-mute">
          {minutesLimit > 0
            ? `${minutesUsed} / ${minutesLimit} minutes · ${activeSessions} active session${activeSessions === 1 ? "" : "s"}`
            : "Upgrade to Pro to enable realtime voice minutes."}
        </p>
      </DashPanel>

      <form onSubmit={save} className="mt-6 space-y-6">
        <DashPanel>
          <VoiceToggle
            label="Enable realtime voice"
            description="Show voice chat in the widget for this project. Requires a Pro plan for voice minutes."
            checked={voiceEnabled}
            onChange={setVoiceEnabled}
          />

          <div className="mt-4 space-y-4 border-t border-ink/[0.06] pt-4">
            <div>
              <label className="text-sm font-medium text-ink">Voice</label>
              <select
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm"
              >
                {GEMINI_VOICE_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-ink">Language</label>
              <DashField
                value={voiceLanguage}
                onChange={(e) => setVoiceLanguage(e.target.value)}
                placeholder="en"
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-ink">Extra voice instructions</label>
              <textarea
                value={voiceInstructionsExtra}
                onChange={(e) => setVoiceInstructionsExtra(e.target.value)}
                rows={4}
                placeholder="Optional: tone, topics to avoid, escalation rules…"
                className="mt-1.5 w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-ink">Fallback if realtime fails</label>
              <select
                value={voiceFallbackMode}
                onChange={(e) =>
                  setVoiceFallbackMode(e.target.value as "transcribe" | "text_only")
                }
                className="mt-1.5 w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm"
              >
                <option value="transcribe">Push-to-talk transcribe, then text reply</option>
                <option value="text_only">Text chat only</option>
              </select>
            </div>
          </div>
        </DashPanel>

        <DashBtn type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save voice settings"}
        </DashBtn>
      </form>
    </div>
  );
}
