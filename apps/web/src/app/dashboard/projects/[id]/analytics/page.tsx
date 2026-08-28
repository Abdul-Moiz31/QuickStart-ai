"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { pct } from "@quickstart-ai/shared";
import { api, getStoredToken } from "@/lib/api";
import { DashPanel } from "@/components/dashboard/DashboardShell";
import {
  QualityBar,
  StatTile,
  ToolBars,
  VolumeBars,
} from "@/components/dashboard/analytics/AnalyticsCharts";

type Analytics = {
  totalConversations: number;
  totalMessages: number;
  avgMessagesPerSession: number;
  analysedAnswers: number;
  answerQuality: number | null;
  qualityBreakdown: { strong: number; weak: number; unscored: number };
  escalationRate: number;
  leadCaptureRate: number;
  dailyVolume: { date: string; count: number }[];
  topToolsUsed: { tool: string; count: number }[];
};

const PERIODS = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
] as const;

type PeriodId = (typeof PERIODS)[number]["id"];

export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const [period, setPeriod] = useState<PeriodId>("30d");
  const [data, setData] = useState<Analytics | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setLoaded(true);
      return;
    }
    const res = await api<{ analytics: Analytics }>(
      `/api/v1/projects/${id}/analytics?period=${period}`,
      { token },
    );
    setData(res.analytics);
    setLoaded(true);
  }, [id, period]);

  useEffect(() => {
    setLoaded(false);
    load().catch((e) => {
      setLoaded(true);
      setMsg(e instanceof Error ? e.message : "Failed to load analytics");
    });
  }, [load]);

  const empty = loaded && (!data || data.totalConversations === 0);

  return (
    <div className="pb-10">
      <h1 className="font-sans text-2xl font-bold text-ink md:text-3xl">Analytics</h1>
      <p className="mt-2 text-sm text-mute">
        How your chatbot performed with real visitors — volume, answer quality, and where
        conversations needed a person.
      </p>

      {msg && (
        <p className="mt-4 rounded-xl border border-ink/[0.08] bg-clay px-4 py-3 text-sm text-ink">
          {msg}
        </p>
      )}

      <div className="mt-6 flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              period === p.id
                ? "bg-ink text-porcelain"
                : "border border-ink/15 text-mute hover:bg-ink/[0.03]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {!loaded ? (
        <p className="mt-8 text-sm text-mute">Reading recent conversations…</p>
      ) : empty ? (
        <div className="mt-8 rounded-xl border border-ink/[0.08] bg-clay px-4 py-10 text-center">
          <p className="text-sm font-medium text-ink">No conversations in this period</p>
          <p className="mt-1 text-sm text-mute">
            Once visitors start chatting, volume and answer quality show up here.
          </p>
        </div>
      ) : (
        data && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile
                label="Conversations"
                value={String(data.totalConversations)}
                hint={`${data.totalMessages} messages`}
              />
              <StatTile
                label="Answered well"
                value={data.answerQuality === null ? "—" : pct(data.answerQuality)}
                hint={
                  data.answerQuality === null
                    ? "No scored answers yet"
                    : `of ${data.qualityBreakdown.strong + data.qualityBreakdown.weak} scored answers`
                }
              />
              <StatTile
                label="Escalated"
                value={pct(data.escalationRate)}
                hint="handed to a person"
              />
              <StatTile
                label="Leads captured"
                value={pct(data.leadCaptureRate)}
                hint="of conversations"
              />
            </div>

            <DashPanel className="mt-6">
              <h2 className="font-sans text-lg font-bold text-ink">Message volume</h2>
              <p className="mt-1 text-sm text-mute">
                Visitor messages per day, averaging{" "}
                {data.avgMessagesPerSession.toFixed(1)} per conversation.
              </p>
              <div className="mt-5">
                <VolumeBars data={data.dailyVolume} />
              </div>
            </DashPanel>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <DashPanel>
                <h2 className="font-sans text-lg font-bold text-ink">Answer quality</h2>
                <p className="mt-1 text-sm text-mute">
                  Across {data.analysedAnswers} answers. Replies a human took over are
                  excluded.
                </p>
                <div className="mt-5">
                  <QualityBar breakdown={data.qualityBreakdown} />
                </div>
                {data.qualityBreakdown.weak > 0 && (
                  <Link
                    href={`/dashboard/projects/${id}/knowledge`}
                    className="mt-5 inline-block text-sm font-medium text-ink underline underline-offset-4"
                  >
                    See which questions fell short
                  </Link>
                )}
              </DashPanel>

              <DashPanel>
                <h2 className="font-sans text-lg font-bold text-ink">Tools used</h2>
                <p className="mt-1 text-sm text-mute">
                  Actions the agent chose beyond searching your knowledge.
                </p>
                <div className="mt-5">
                  {data.topToolsUsed.length === 0 ? (
                    <p className="text-sm text-mute">
                      No tools fired in this period.
                    </p>
                  ) : (
                    <ToolBars data={data.topToolsUsed} />
                  )}
                </div>
              </DashPanel>
            </div>
          </>
        )
      )}
    </div>
  );
}
