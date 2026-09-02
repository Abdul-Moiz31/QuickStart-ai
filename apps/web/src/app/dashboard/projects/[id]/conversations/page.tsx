"use client";

import { FormEvent, Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Inbox, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { isAnonymousVisitor } from "@quickstart-ai/shared";
import { api, getStoredToken } from "@/lib/api";
import { DashBtn } from "@/components/dashboard/DashboardShell";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import {
  ChatMessageContent,
  ChatTypingIndicator,
  plainChatPreviewWords,
} from "@/components/dashboard/ChatMessageContent";

type ChatMsg = { role: "user" | "assistant" | "agent"; content: string };
type SessionRow = {
  id: string;
  visitorName: string;
  visitorEmail: string;
  channel?: string;
  messageCount: number;
  lastMessage: string;
  updatedAt?: string;
  createdAt?: string;
};

const CHANNEL_BADGE: Record<string, { label: string; className: string }> = {
  whatsapp: { label: "WA", className: "bg-emerald-600 text-white" },
  sms: { label: "SMS", className: "bg-ink text-white" },
  instagram: { label: "IG", className: "bg-fuchsia-600 text-white" },
};

function ChannelBadge({ channel }: { channel?: string }) {
  if (!channel || channel === "web") return null;
  const badge = CHANNEL_BADGE[channel];
  if (!badge) return null;
  return (
    <span
      title={badge.label}
      className={`absolute -bottom-1 -right-1 rounded-full px-1 py-0.5 text-[9px] font-bold leading-none ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}

function formatWhen(value?: string) {
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

function ChatBubble({
  role,
  content,
  visitorLabel,
}: {
  role: "user" | "assistant" | "agent";
  content: string;
  visitorLabel: string;
}) {
  const isUser = role === "user";
  // A human reply during a handoff. Shown apart from the bot so the transcript
  // makes it obvious where a person took over.
  const isAgent = role === "agent";

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
          isUser ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-ink/10"
        }`}
        aria-hidden
      >
        {isUser ? initials(visitorLabel) : isAgent ? "YOU" : "QS"}
      </span>
      <div
        className={`max-w-[min(100%,540px)] px-4 py-3 ${
          isUser
            ? "rounded-full bg-ink text-white"
            : isAgent
              ? "rounded-2xl rounded-tl-md border border-ink/30 bg-white text-ink shadow-[0_1px_2px_rgba(10,10,10,0.04)]"
              : "rounded-2xl rounded-tl-md border border-ink/[0.08] bg-clay text-ink shadow-[0_1px_2px_rgba(10,10,10,0.04)]"
        }`}
      >
        {isAgent && (
          <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-ink/50">
            Support agent
          </span>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        ) : (
          <ChatMessageContent content={content} />
        )}
      </div>
    </div>
  );
}

export default function ConversationsPage() {
  const { id } = useParams<{ id: string }>();
  const { projects, user } = useDashboard();
  const project = projects.find((p) => p.id === id);

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<ChatMsg[]>([]);
  const [selectedMeta, setSelectedMeta] = useState<SessionRow | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  const [testOpen, setTestOpen] = useState(false);
  const [testSessionId, setTestSessionId] = useState<string | null>(null);
  const [testMessages, setTestMessages] = useState<ChatMsg[]>([]);
  const [testInput, setTestInput] = useState("");
  const [testBusy, setTestBusy] = useState(false);
  const testBottomRef = useRef<HTMLDivElement>(null);
  const threadBottomRef = useRef<HTMLDivElement>(null);

  const visitorLabel = useMemo(
    () => selectedMeta?.visitorName || selectedMeta?.visitorEmail || "Visitor",
    [selectedMeta],
  );

  const loadSessions = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return [];
    const res = await api<{ sessions: SessionRow[] }>(`/api/v1/projects/${id}/sessions`, {
      token,
    });
    setSessions(res.sessions);
    return res.sessions;
  }, [id]);

  const openSession = useCallback(
    async (sid: string, row?: SessionRow) => {
      const token = getStoredToken();
      if (!token) return;
      setLoadingThread(true);
      setSelectedId(sid);
      setError("");
      try {
        const res = await api<{
          session: {
            visitorName?: string;
            visitorEmail?: string;
            updatedAt?: string;
            createdAt?: string;
            messages?: { role: string; content: string }[];
          };
        }>(`/api/v1/projects/${id}/sessions/${sid}`, { token });
        setSelectedMessages(
          (res.session.messages || []).map((m) => ({
            role:
              m.role === "assistant" ? "assistant" : m.role === "agent" ? "agent" : "user",
            content: m.content,
          })),
        );
        setSelectedMeta(
          row ?? {
            id: sid,
            visitorName: res.session.visitorName ?? "Visitor",
            visitorEmail: res.session.visitorEmail ?? "",
            messageCount: res.session.messages?.length ?? 0,
            lastMessage: "",
            updatedAt: res.session.updatedAt,
            createdAt: res.session.createdAt,
          },
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not open conversation");
      } finally {
        setLoadingThread(false);
      }
    },
    [id],
  );

  useEffect(() => {
    setLoadingList(true);
    loadSessions()
      .then((list) => {
        if (list.length > 0) void openSession(list[0]!.id, list[0]);
        else {
          setSelectedId(null);
          setSelectedMeta(null);
          setSelectedMessages([]);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoadingList(false));
  }, [loadSessions, openSession]);

  useEffect(() => {
    threadBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedMessages, loadingThread]);

  useEffect(() => {
    if (!testOpen) return;
    testBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [testMessages, testBusy, testOpen]);

  async function openTestModal() {
    setTestOpen(true);
    setError("");
    setTestInput("");
    const token = getStoredToken();
    if (!token) return;
    try {
      const res = await api<{
        sessionId: string;
        messages: ChatMsg[];
      }>(`/api/v1/projects/${id}/playground/reset`, {
        method: "POST",
        token,
      });
      setTestSessionId(res.sessionId);
      setTestMessages(
        (res.messages || []).map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start test chat");
      setTestOpen(false);
    }
  }

  function closeTestModal() {
    setTestOpen(false);
    setTestSessionId(null);
    setTestMessages([]);
    setTestInput("");
  }

  async function sendTest(e?: FormEvent) {
    e?.preventDefault();
    const text = testInput.trim();
    if (!text || testBusy) return;
    const token = getStoredToken();
    if (!token) return;

    setTestInput("");
    setTestBusy(true);
    setTestMessages((m) => [...m, { role: "user", content: text }]);

    try {
      const res = await api<{
        sessionId: string;
        answer: string;
        messages?: ChatMsg[];
      }>(`/api/v1/projects/${id}/playground/message`, {
        method: "POST",
        token,
        body: JSON.stringify({ message: text, sessionId: testSessionId || undefined }),
      });
      setTestSessionId(res.sessionId);
      if (res.messages?.length) {
        setTestMessages(
          res.messages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
        );
      } else {
        setTestMessages((m) => [...m, { role: "assistant", content: res.answer }]);
      }
    } catch (err) {
      setTestMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: err instanceof Error ? err.message : "Sorry — something went wrong.",
        },
      ]);
    } finally {
      setTestBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="qs-h1">Conversations</h1>
          <p className="mt-2 max-w-xl text-sm text-mute">
            Visitor chats live here. Use the test button to privately check answers from your
            knowledge — tests never show in this list.
          </p>
        </div>
        <DashBtn type="button" onClick={() => void openTestModal()}>
          <Sparkles className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
          Try a test conversation
        </DashBtn>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-ink/[0.08] bg-clay px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-soft">
        <div className="grid h-[calc(100vh-11rem)] min-h-[580px] lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Inbox */}
          <aside className="flex min-h-0 flex-col overflow-hidden border-b border-ink/[0.08] bg-clay/50 lg:border-b-0 lg:border-r lg:border-ink/[0.08]">
            <div className="flex shrink-0 items-center justify-between border-b border-ink/[0.06] px-4 py-3.5">
              <p className="qs-micro-label">Inbox</p>
              <span className="rounded-full bg-white px-2.5 py-0.5 font-mono text-[10px] text-mute ring-1 ring-ink/[0.06]">
                {sessions.length}
              </span>
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {loadingList && (
                <li className="px-4 py-10 text-center text-sm text-mute">Loading conversations…</li>
              )}
              {!loadingList &&
                sessions.map((s) => {
                  const active = selectedId === s.id;
                  const preview = plainChatPreviewWords(s.lastMessage || "No messages yet", 9);
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => void openSession(s.id, s)}
                        className={`flex w-full gap-3 border-b border-ink/[0.05] px-4 py-3.5 text-left transition ${
                          active ? "bg-white shadow-[inset_3px_0_0_0_#0A0A0A]" : "hover:bg-white/70"
                        }`}
                      >
                        <span className="relative mt-0.5 shrink-0">
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold ${
                              active ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-ink/10"
                            }`}
                          >
                            {initials(s.visitorName || s.visitorEmail || "?")}
                          </span>
                          <ChannelBadge channel={s.channel} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-ink">
                              {s.visitorName || "Visitor"}
                            </span>
                            {isAnonymousVisitor(s.visitorEmail) && (
                              <span className="shrink-0 rounded-full bg-ink/8 px-1.5 py-0.5 text-[10px] font-semibold text-ink/70">
                                Anonymous
                              </span>
                            )}
                          </span>
                          <span className="mt-1 block truncate text-xs text-mute">
                            {preview}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              {!loadingList && sessions.length === 0 && (
                <li className="px-6 py-14 text-center">
                  <Inbox className="mx-auto h-7 w-7 text-mute" strokeWidth={1.5} />
                  <p className="mt-3 text-sm font-medium text-ink">No visitor chats yet</p>
                  <p className="mt-1 text-xs text-mute">
                    When people use your embed, their sessions appear here.
                  </p>
                </li>
              )}
            </ul>
          </aside>

          {/* Thread */}
          <section className="flex min-h-0 flex-col overflow-hidden bg-porcelain">
            {selectedMeta ? (
              <>
                <header className="sticky top-0 z-10 shrink-0 border-b border-ink/[0.06] bg-white px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                      {initials(selectedMeta.visitorName || selectedMeta.visitorEmail)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-display text-base font-bold text-ink">
                        {selectedMeta.visitorName || "Visitor"}
                      </h2>
                      <p className="truncate text-sm text-mute">
                        {isAnonymousVisitor(selectedMeta.visitorEmail)
                          ? "Anonymous visitor"
                          : selectedMeta.visitorEmail}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2.5 font-mono text-[11px] text-mute">
                    {selectedMessages.length} messages
                    {selectedMeta.updatedAt
                      ? ` · last active ${formatWhen(selectedMeta.updatedAt)}`
                      : ""}
                  </p>
                </header>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-5">
                  {loadingThread ? (
                    <div className="flex items-center justify-center py-16">
                      <p className="text-sm text-mute">Loading messages…</p>
                    </div>
                  ) : selectedMessages.length === 0 ? (
                    <div className="flex items-center justify-center py-16">
                      <p className="text-sm text-mute">No messages in this session.</p>
                    </div>
                  ) : (
                    selectedMessages.map((m, i) => (
                      <ChatBubble
                        key={`${i}-${m.role}-${m.content.slice(0, 24)}`}
                        role={m.role}
                        content={m.content}
                        visitorLabel={visitorLabel}
                      />
                    ))
                  )}
                  <div ref={threadBottomRef} />
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-soft ring-1 ring-ink/[0.06]">
                  <MessageCircle className="h-6 w-6 text-mute" strokeWidth={1.5} />
                </div>
                <p className="mt-4 font-sans text-lg font-bold text-ink">Select a conversation</p>
                <p className="mt-1 max-w-sm text-sm text-mute">
                  Pick a visitor session from the inbox to read the full exchange.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Private test modal */}
      <Transition show={testOpen} as={Fragment}>
        <Dialog onClose={closeTestModal} className="relative z-50">
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
              <DialogPanel className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-soft">
                <div className="flex items-start justify-between gap-3 border-b border-ink/[0.06] bg-white px-4 py-3.5">
                  <div>
                    <p className="qs-micro-label">
                      Private test
                    </p>
                    <DialogTitle className="mt-0.5 font-sans text-base font-bold text-ink">
                      Try a test conversation
                    </DialogTitle>
                    <p className="mt-0.5 text-xs text-mute">
                      Won&apos;t appear in your inbox · {user?.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeTestModal}
                    className="rounded-lg p-2 text-mute transition hover:bg-clay hover:text-ink"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-ink px-4 py-2.5 text-xs font-medium text-white">
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {project?.name ?? "Project"} chatbot
                </div>

                <div className="flex min-h-0 flex-1 flex-col bg-clay/30">
                  <div className="max-h-[46vh] flex-1 space-y-3 overflow-y-auto px-4 py-4">
                    {testMessages.map((m, i) => (
                      <ChatBubble
                        key={`${i}-${m.content.slice(0, 12)}`}
                        role={m.role}
                        content={m.content}
                        visitorLabel={user?.name || user?.email || "You"}
                      />
                    ))}
                    {testBusy && (
                      <div className="flex gap-2.5">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-ink ring-1 ring-ink/10">
                          QS
                        </span>
                        <ChatTypingIndicator />
                      </div>
                    )}
                    <div ref={testBottomRef} />
                  </div>

                  <form
                    onSubmit={sendTest}
                    className="flex gap-2 border-t border-ink/[0.06] bg-white p-3"
                  >
                    <input
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      placeholder="Ask about your business…"
                      className="flex-1 rounded-xl border border-ink/15 bg-porcelain px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-mute focus:border-ink/40"
                      disabled={testBusy}
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={testBusy || !testInput.trim()}
                      className="inline-flex items-center justify-center rounded-xl bg-ink px-3.5 py-2.5 text-white disabled:opacity-50"
                      aria-label="Send"
                    >
                      <Send className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </form>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
