"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Headset, Send, UserCheck } from "lucide-react";
import { api, getStoredToken, resolvePublicApiUrl } from "@/lib/api";
import { isAnonymousVisitor } from "@quickstart-ai/shared";
import { DashBtn } from "@/components/dashboard/DashboardShell";
import { ChatMessageContent, ChatTypingIndicator } from "@/components/dashboard/ChatMessageContent";

type AgentUser = { id: string; name: string; email: string };

type InboxRow = {
  id: string;
  visitorName: string;
  visitorEmail: string;
  humanPending: boolean;
  humanActive: boolean;
  agentId: string | null;
  agent: AgentUser | null;
  canTakeover: boolean;
  canReply: boolean;
  escalatedAt: string | null;
  messageCount: number;
  lastMessage: { role: string; content: string } | null;
  updatedAt: string | null;
};

type TranscriptMsg = { role: string; content: string; createdAt: string | null };

function formatWhen(value?: string | null) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export default function InboxPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const projectId = params?.id ?? "";
  const deeplinkSession = searchParams.get("session");

  const [rows, setRows] = useState<InboxRow[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [transcript, setTranscript] = useState<TranscriptMsg[]>([]);
  const [humanActive, setHumanActive] = useState(false);
  const [canReply, setCanReply] = useState(false);
  const [canTakeover, setCanTakeover] = useState(true);
  const [assignedAgent, setAssignedAgent] = useState<AgentUser | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [visitorTyping, setVisitorTyping] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef("");
  const visitorTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingPing = useRef(0);

  // Mirrored into a ref rather than added to the stream effect's deps:
  // resubscribing on every selection would drop events during the gap.
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const loadInbox = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await api<{ sessions: InboxRow[] }>(`/api/v1/projects/${projectId}/inbox`, {
        token: getStoredToken() ?? undefined,
      });
      setRows(res.sessions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the inbox");
    }
  }, [projectId]);

  const loadTranscript = useCallback(async (sessionId: string) => {
    try {
      const res = await api<{
        session: {
          humanActive: boolean;
          canReply: boolean;
          canTakeover: boolean;
          agent: AgentUser | null;
          messages: TranscriptMsg[];
        };
      }>(`/api/v1/agent/sessions/${sessionId}`, { token: getStoredToken() ?? undefined });
      setTranscript(res.session.messages);
      setHumanActive(res.session.humanActive);
      setCanReply(res.session.canReply);
      setCanTakeover(res.session.canTakeover);
      setAssignedAgent(res.session.agent);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the conversation");
    }
  }, []);

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  useEffect(() => {
    if (deeplinkSession && rows.some((r) => r.id === deeplinkSession)) {
      setActiveId(deeplinkSession);
    }
  }, [deeplinkSession, rows]);

  useEffect(() => {
    if (!activeId) return;
    void loadTranscript(activeId);
  }, [activeId, loadTranscript]);

  // EventSource cannot set an Authorization header, so these streams authenticate
  // with the session cookie.
  useEffect(() => {
    if (!projectId) return;
    const streamUrl = new URL(`${resolvePublicApiUrl()}/api/v1/projects/${projectId}/inbox/stream`);
    const token = getStoredToken();
    if (token) streamUrl.searchParams.set("token", token);
    const source = new EventSource(streamUrl.toString(), { withCredentials: true });

    source.onmessage = (ev: MessageEvent<string>) => {
      let event: { type: string; sessionId?: string; content?: string };
      try {
        event = JSON.parse(ev.data);
      } catch {
        return;
      }

      if (event.type === "escalation" || event.type === "session_released") {
        void loadInbox();
        return;
      }
      if (event.type === "session_taken") {
        void loadInbox();
        return;
      }
      if (event.type === "visitor_typing" && event.sessionId === activeIdRef.current) {
        setVisitorTyping(true);
        if (visitorTypingTimer.current) clearTimeout(visitorTypingTimer.current);
        visitorTypingTimer.current = setTimeout(() => setVisitorTyping(false), 5000);
        return;
      }
      if (event.type === "visitor_message") {
        void loadInbox();
        if (event.sessionId === activeIdRef.current && event.content) {
          setVisitorTyping(false);
          setTranscript((t) => [...t, { role: "user", content: event.content!, createdAt: null }]);
        }
      }
    };

    return () => {
      source.close();
      if (visitorTypingTimer.current) clearTimeout(visitorTypingTimer.current);
    };
  }, [projectId, loadInbox]);

  const active = useMemo(() => rows.find((r) => r.id === activeId) ?? null, [rows, activeId]);
  const pendingCount = rows.filter((r) => r.humanPending).length;

  async function takeover() {
    if (!activeId) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/v1/agent/sessions/${activeId}/takeover`, {
        method: "PATCH",
        token: getStoredToken() ?? undefined,
      });
      setHumanActive(true);
      setCanReply(true);
      await loadInbox();
    } catch (e) {
      // A 409 here means another tab or agent claimed it first.
      setError(e instanceof Error ? e.message : "Could not take over");
      await loadInbox();
    } finally {
      setBusy(false);
    }
  }

  async function release() {
    if (!activeId) return;
    setBusy(true);
    try {
      await api(`/api/v1/agent/sessions/${activeId}/release`, {
        method: "PATCH",
        token: getStoredToken() ?? undefined,
      });
      setHumanActive(false);
      await loadInbox();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not hand back");
    } finally {
      setBusy(false);
    }
  }

  function notifyTyping() {
    if (!canReply || !activeId) return;
    const now = Date.now();
    // Same throttle as the widget side: this is one request per ping.
    if (now - lastTypingPing.current < 4000) return;
    lastTypingPing.current = now;
    void api(`/api/v1/agent/sessions/${activeId}/typing`, {
      method: "POST",
      token: getStoredToken() ?? undefined,
    }).catch(() => {
      // Presence is cosmetic.
    });
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    const content = reply.trim();
    if (!content || !activeId || busy) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/v1/agent/sessions/${activeId}/message`, {
        method: "POST",
        body: JSON.stringify({ content }),
        token: getStoredToken() ?? undefined,
      });
      setReply("");
      setTranscript((t) => [...t, { role: "agent", content, createdAt: null }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the reply");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-6 py-8 md:px-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="qs-h1">Inbox</h1>
          <p className="qs-body">
            Conversations your bot escalated. Take one over to reply as a person.
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-600">
            {pendingCount} waiting
          </span>
        )}
      </header>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr] lg:items-stretch">
        <aside className="flex max-h-[calc(100vh-11rem)] min-h-[420px] flex-col overflow-hidden rounded-xl border border-ink/[0.08] bg-white">
          {rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-ink/50">
              Nothing escalated yet. Conversations appear here the moment the bot hands one off.
            </p>
          ) : (
            <ul className="divide-y divide-ink/[0.06] overflow-y-auto">
              {rows.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(row.id)}
                    className={`flex w-full items-start gap-3 p-3 text-left transition hover:bg-clay ${
                      row.id === activeId ? "bg-clay" : ""
                    }`}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-white">
                      {initials(row.visitorName)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-ink">
                          {row.visitorName}
                        </span>
                        {isAnonymousVisitor(row.visitorEmail) && (
                          <span className="shrink-0 rounded-full bg-ink/8 px-1.5 py-0.5 text-[10px] font-semibold text-ink/70">
                            Anonymous
                          </span>
                        )}
                        {row.humanPending && (
                          <span className="shrink-0 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                            waiting
                          </span>
                        )}
                        {row.humanActive && row.agent && (
                          <span className="shrink-0 rounded-full bg-ink/8 px-1.5 py-0.5 text-[10px] font-semibold text-ink/70">
                            {row.agent.name.split(" ")[0]}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-ink/55">
                        {row.lastMessage?.content ?? "No messages yet"}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-ink/40">
                        {formatWhen(row.escalatedAt ?? row.updatedAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="flex h-[calc(100vh-11rem)] min-h-[420px] flex-col overflow-hidden rounded-xl border border-ink/[0.08] bg-white">
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <Headset className="h-6 w-6 text-ink/25" />
              <p className="text-sm text-ink/50">Pick a conversation to read it.</p>
            </div>
          ) : (
            <>
              <div className="sticky top-0 z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-ink/[0.08] bg-white p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{active.visitorName}</p>
                  <p className="truncate text-xs text-ink/55">
                    {isAnonymousVisitor(active.visitorEmail) ? "Anonymous visitor" : active.visitorEmail}
                  </p>
                  {humanActive && assignedAgent && !canReply && (
                    <p className="mt-1 text-xs font-medium text-amber-700">
                      Taken by {assignedAgent.name}
                    </p>
                  )}
                </div>
                {humanActive && canReply ? (
                  <DashBtn
                    type="button"
                    onClick={release}
                    disabled={busy}
                    className="!px-3 !py-1.5 text-xs"
                  >
                    Hand back to bot
                  </DashBtn>
                ) : canTakeover ? (
                  <DashBtn
                    type="button"
                    onClick={takeover}
                    disabled={busy}
                    className="!px-3 !py-1.5 text-xs"
                  >
                    <UserCheck className="mr-1 inline h-3.5 w-3.5" />
                    Take over
                  </DashBtn>
                ) : null}
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                {transcript.map((m, i) => {
                  const isVisitor = m.role === "user";
                  const isAgent = m.role === "agent";
                  return (
                    <div key={i} className={`flex ${isVisitor ? "" : "justify-end"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                          isVisitor
                            ? "bg-clay text-ink"
                            : isAgent
                              ? "bg-ink text-white"
                              : "bg-white text-ink ring-1 ring-ink/10"
                        }`}
                      >
                        {!isVisitor && (
                          <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide opacity-60">
                            {isAgent ? "You" : "Bot"}
                          </span>
                        )}
                        <ChatMessageContent content={m.content} />
                      </div>
                    </div>
                  );
                })}
                {visitorTyping && (
                  <div className="flex">
                    <div className="rounded-2xl bg-clay px-3 py-2">
                      <ChatTypingIndicator />
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <form
                onSubmit={send}
                className="flex shrink-0 gap-2 border-t border-ink/[0.08] bg-white p-3"
              >
                <input
                  value={reply}
                  onChange={(e) => {
                    setReply(e.target.value);
                    notifyTyping();
                  }}
                  placeholder={
                    canReply
                      ? "Reply as a person…"
                      : humanActive
                        ? "Read-only — another agent is replying"
                        : "Take the conversation over to reply"
                  }
                  disabled={!canReply || busy}
                  className="flex-1 rounded-full border border-ink/15 px-4 py-2 text-sm outline-none focus:border-ink/40 disabled:bg-clay disabled:text-ink/40"
                />
                <DashBtn
                  type="submit"
                  disabled={!canReply || busy || !reply.trim()}
                  className="!px-4 !py-2 text-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                </DashBtn>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
