"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import {
  pct,
  readinessLabel,
  type EvalCategory,
  type EvalReadiness,
} from "@quickstart-ai/shared";
import { api, getStoredToken } from "@/lib/api";
import { DashBtn, DashPanel, StatusPill } from "@/components/dashboard/DashboardShell";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { RingProgress, SimpleProgressBar } from "@/components/dashboard/eval/EvalCharts";
import { EvalLoadingOverlay } from "@/components/dashboard/eval/EvalLoadingOverlay";

type EvalProgress = {
  current: number;
  total: number;
  message: string;
  phase: string;
};

type EvalStatus = {
  qaCount: number;
  minQaRequired: number;
  hasEnoughKnowledge: boolean;
  productionReady: boolean;
  readiness: EvalReadiness;
  activeRun: {
    id: string;
    status: string;
    metrics: Record<string, unknown> | null;
  } | null;
  lastRun: {
    id: string;
    status: string;
    metrics: Record<string, unknown> | null;
    finishedAt: string | null;
  } | null;
};

type QuestionResult = { id: string; question: string; answer: string; passed: boolean };

function CategoryRow({ cat }: { cat: EvalCategory }) {
  const weak = cat.status === "weak" || cat.status === "fair";
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-ink">{cat.label}</span>
        <span className="font-medium tabular-nums text-ink">
          {cat.status === "pending" ? "—" : pct(cat.score)}
        </span>
      </div>
      <SimpleProgressBar value={cat.status === "pending" ? 0 : cat.score} />
      {weak && cat.status !== "pending" && (
        <p className="mt-1.5 text-xs text-mute">{cat.hint}</p>
      )}
    </div>
  );
}

function progressFromStatus(status: EvalStatus | null): EvalProgress | null {
  const metrics = status?.activeRun?.metrics as { progress?: EvalProgress } | null;
  return metrics?.progress ?? null;
}

export default function EvalPage() {
  const { id } = useParams<{ id: string }>();
  const { refreshProjects } = useDashboard();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<EvalStatus | null>(null);
  const [msg, setMsg] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadStatus = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return null;
    try {
      const res = await api<{ status: EvalStatus }>(`/api/v1/projects/${id}/eval/status`, {
        token,
      });
      setStatus(res.status);
      return res.status;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to load");
      return null;
    }
  }, [id]);

  useEffect(() => {
    void loadStatus();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadStatus]);

  const isRunning = Boolean(
    status?.activeRun && ["queued", "running"].includes(status.activeRun.status),
  );
  const progress = progressFromStatus(status);

  useEffect(() => {
    if (isRunning && !pollRef.current) {
      pollRef.current = setInterval(() => {
        void loadStatus();
      }, 2000);
    }
    if (!isRunning && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [isRunning, loadStatus]);

  const readiness = status?.readiness ?? null;
  const ready = status?.hasEnoughKnowledge ?? false;
  const hasRun = Boolean(status?.lastRun && !isRunning);
  const passed = status?.lastRun?.status === "passed";
  const qaCount = status?.qaCount ?? 0;
  const minQa = status?.minQaRequired ?? 7;
  const categories = readiness?.categories ?? [];

  const results = useMemo(() => {
    const m = status?.lastRun?.metrics as { results?: QuestionResult[] } | null;
    return m?.results ?? [];
  }, [status?.lastRun]);

  async function runEval() {
    const token = getStoredToken();
    if (!token) return;
    setBusy(true);
    setMsg("");
    try {
      await api(`/api/v1/projects/${id}/eval/run`, { method: "POST", token });
      setMsg("Evaluation queued — testing your FAQ now.");
      await loadStatus();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Eval failed");
    } finally {
      setBusy(false);
    }
  }

  // Refresh project list when eval finishes
  useEffect(() => {
    if (!isRunning && status?.lastRun?.finishedAt) {
      void refreshProjects();
    }
  }, [isRunning, status?.lastRun?.finishedAt, refreshProjects]);

  useEffect(() => {
    if (!isRunning && status?.lastRun && status.lastRun.status !== "passed") {
      const reasons = (status.lastRun.metrics as { reasons?: string[] })?.reasons;
      if (reasons?.length) {
        setMsg("Evaluation complete — some categories need improvement.");
      } else if (status.lastRun.status === "passed") {
        setMsg("Evaluation complete — strong scores for production.");
      }
    }
  }, [isRunning, status?.lastRun]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
      {isRunning && (
        <EvalLoadingOverlay
          message={progress?.message ?? "Running evaluation…"}
          current={progress?.current ?? 0}
          total={progress?.total ?? 0}
        />
      )}

      <h1 className="font-sans text-2xl font-bold text-ink md:text-3xl">Eval</h1>
      <p className="mt-2 text-sm text-mute">
        Quality check across domain, details, relevance, and speed. Your chatbot always works —
        use this to see what to improve before production.
      </p>

      {msg && (
        <p className="mt-4 rounded-xl border border-ink/[0.08] bg-clay px-4 py-3 text-sm text-ink">
          {msg}
        </p>
      )}

      <DashPanel className="mt-6 text-center">
        {readiness && <RingProgress value={readiness.overallScore} />}

        <h2 className="mt-6 font-sans text-lg font-bold text-ink">
          {readiness ? readinessLabel(readiness.overallScore, hasRun) : "Loading…"}
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-mute">
          {!ready
            ? "Add FAQ in Knowledge, then run eval here."
            : isRunning
              ? "Evaluation in progress…"
              : !hasRun
                ? "Run eval to see which categories need work."
                : passed
                  ? "Good scores overall. Test in Conversations to confirm."
                  : "Review weak categories below and improve your FAQ."}
        </p>

        <div className="mt-8 space-y-5 text-left">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-ink">Knowledge</span>
              <span className="font-medium tabular-nums text-ink">
                {qaCount} / {minQa} Q&amp;A
              </span>
            </div>
            <SimpleProgressBar value={qaCount / minQa} />
          </div>

          {categories.length > 0 && (
            <div className="space-y-4 border-t border-ink/[0.06] pt-5">
              {categories.map((cat) => (
                <CategoryRow key={cat.id} cat={cat} />
              ))}
            </div>
          )}

          {hasRun && (
            <div className="flex items-center justify-between border-t border-ink/[0.06] pt-5 text-sm">
              <span className="text-ink">Overall eval</span>
              <StatusPill status={passed ? "READY" : "FAILED"} />
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <DashBtn type="button" onClick={runEval} disabled={busy || !ready || isRunning}>
            {busy || isRunning ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isRunning ? "Evaluating…" : "Starting…"}
              </span>
            ) : (
              hasRun ? "Run again" : "Run eval"
            )}
          </DashBtn>
          {!ready && (
            <Link
              href={`/dashboard/projects/${id}/knowledge`}
              className="text-sm text-mute underline-offset-2 hover:text-ink hover:underline"
            >
              Add knowledge
            </Link>
          )}
        </div>
      </DashPanel>

      <p className="mt-4 text-center text-xs text-mute">
        Chatbot is always available on your embed. Test real conversations in{" "}
        <Link href={`/dashboard/projects/${id}/conversations`} className="underline hover:text-ink">
          Conversations
        </Link>{" "}
        to ensure smooth production use.
      </p>

      {hasRun && results.length > 0 && (
        <DashPanel className="mt-6 !p-0">
          <button
            type="button"
            onClick={() => setDetailsOpen((o) => !o)}
            className="flex w-full items-center justify-between px-6 py-4 text-left"
          >
            <span className="text-sm font-medium text-ink">Question results</span>
            <ChevronDown
              className={`h-4 w-4 text-mute transition ${detailsOpen ? "rotate-180" : ""}`}
            />
          </button>
          {detailsOpen && (
            <ul className="divide-y divide-ink/[0.06] border-t border-ink/[0.06]">
              {results.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 px-6 py-3">
                  <p className="text-sm text-ink">{r.question}</p>
                  <StatusPill status={r.passed ? "READY" : "FAILED"} />
                </li>
              ))}
            </ul>
          )}
        </DashPanel>
      )}
    </div>
  );
}
