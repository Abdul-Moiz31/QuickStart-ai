"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, getStoredToken } from "@/lib/api";
import { DashBtn, DashPanel } from "@/components/dashboard/DashboardShell";
import { CustomToolsSection } from "@/components/dashboard/CustomToolsSection";
import { useDashboard } from "@/components/dashboard/DashboardContext";

function ToolToggle({
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

export default function ToolsPage() {
  const { id } = useParams<{ id: string }>();
  const { refreshProjects } = useDashboard();
  const [webSearch, setWebSearch] = useState(false);
  const [humanHandoff, setHumanHandoff] = useState(true);
  const [leadCapture, setLeadCapture] = useState(false);
  const [credits, setCredits] = useState(0);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api<{
      project: {
        toolsWebSearch: boolean;
        toolsHumanHandoff: boolean;
        toolsLeadCapture: boolean;
        credits: number;
      };
    }>(`/api/v1/projects/${id}`, { token }).then((res) => {
      setWebSearch(Boolean(res.project.toolsWebSearch));
      setHumanHandoff(res.project.toolsHumanHandoff !== false);
      setLeadCapture(Boolean(res.project.toolsLeadCapture));
      setCredits(res.project.credits ?? 0);
    });
  }, [id]);

  async function save(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken();
    if (!token) return;
    setBusy(true);
    try {
      await api(`/api/v1/projects/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          toolsWebSearch: webSearch,
          toolsHumanHandoff: humanHandoff,
          toolsLeadCapture: leadCapture,
        }),
      });
      setMsg("Tools updated");
      await refreshProjects();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
      <h1 className="qs-h1">Tools</h1>
      <p className="mt-2 text-sm text-mute">
        Enable extras your chatbot can use while answering visitors.
      </p>
      {msg && <p className="mt-4 text-sm text-mute">{msg}</p>}
      <form onSubmit={save} className="mt-6">
        <DashPanel>
          <ToolToggle
            label="Web search"
            description="Fetch public context from your business website when docs aren't enough."
            checked={webSearch}
            onChange={setWebSearch}
          />
          <ToolToggle
            label="Human handoff"
            description="Let the bot escalate to a human when it can't answer confidently."
            checked={humanHandoff}
            onChange={setHumanHandoff}
          />
          <ToolToggle
            label="Lead capture"
            description="Collect name and email when visitors ask for a callback or follow-up. Configure Slack and webhooks in Integrations."
            checked={leadCapture}
            onChange={setLeadCapture}
          />
          <p className="mt-2 text-sm text-mute">
            To let visitors chat without name or email first, enable{" "}
            <a
              href={`/dashboard/projects/${id}/settings`}
              className="font-medium text-ink underline underline-offset-2"
            >
              anonymous chat
            </a>{" "}
            under Settings → Visitor access.
          </p>
          <p className="mt-4 text-sm text-mute">
            Send leads, handoffs, and custom alerts from{" "}
            <a
              href={`/dashboard/projects/${id}/notifications`}
              className="font-medium text-ink underline underline-offset-2"
            >
              Notifications
            </a>
            . Define keyword triggers in{" "}
            <a
              href={`/dashboard/projects/${id}/custom-events`}
              className="font-medium text-ink underline underline-offset-2"
            >
              Custom events
            </a>
            .
          </p>
          <DashBtn type="submit" disabled={busy} className="mt-6">
            {busy ? "Saving…" : "Save tools"}
          </DashBtn>
        </DashPanel>
      </form>
      <div className="mt-4 space-y-4">
        <CustomToolsSection projectId={id} />
        <DashPanel>
          <p className="qs-micro-label">Credits</p>
          <p className="mt-1 font-mono text-2xl font-bold text-ink">{credits}</p>
          <p className="mt-1 text-sm text-mute">Remaining for this project.</p>
        </DashPanel>
      </div>
    </div>
  );
}
