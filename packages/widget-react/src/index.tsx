import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChatRequestError,
  QuickStartClient,
  resolveWidgetSurface,
  type ChatMessage,
  type WidgetTheme,
} from "@quickstart-ai/widget-core";

export interface ChatBotProps {
  clientId: string;
  apiUrl?: string;
  theme?: WidgetTheme;
  position?: "left" | "right";
  primaryColor?: string;
  /** @deprecated use clientId */
  token?: string;
}

const INK = "#0A0A0A";
const CLAY = "#F7F5F1";

const markdownStyles = `
.qs-widget-fab,
.qs-widget-panel,
.qs-widget-panel * {
  box-sizing: border-box;
}
.qs-md {
  font-size: 13px;
  line-height: 1.55;
  word-break: break-word;
  overflow-wrap: anywhere;
  max-width: 100%;
}
.qs-md p { margin: 0 0 0.5em; }
.qs-md p:last-child { margin-bottom: 0; }
.qs-md ul, .qs-md ol {
  margin: 0.35em 0 0.5em;
  padding-left: 0.35em;
  list-style-position: inside;
}
.qs-md ul {
  list-style-type: disc;
}
.qs-md ol {
  list-style-type: decimal;
}
.qs-md li {
  margin: 0.2em 0;
  display: list-item;
}
.qs-md li > p { margin: 0; }
.qs-md strong { font-weight: 600; }
.qs-md a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
.qs-md code {
  font-size: 0.86em;
  padding: 0.12em 0.4em;
  border-radius: 5px;
  background: rgba(10,10,10,0.07);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  word-break: break-all;
}
.qs-md pre {
  margin: 0.45em 0 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #0f172a;
  color: #e2e8f0;
  overflow-x: auto;
  max-width: 100%;
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.qs-md pre code {
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: inherit;
  word-break: break-word;
}
.qs-widget-bubble {
  min-width: 0;
  max-width: 88%;
  overflow-x: hidden;
}
.qs-widget-bubble--user {
  border-radius: 18px 18px 4px 18px;
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}
.qs-widget-bubble--assistant {
  border-radius: 18px 18px 18px 4px;
  padding: 10px 14px;
  border: 1px solid rgba(10,10,10,0.07);
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(10,10,10,0.04);
}
.qs-widget-bubble--agent {
  border-radius: 18px 18px 18px 4px;
  padding: 10px 14px;
  border: 1px solid rgba(10,10,10,0.12);
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(10,10,10,0.04);
}
.qs-handoff-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  max-width: 88%;
  min-width: 0;
}
.qs-handoff-btn {
  border: none;
  border-radius: 9999px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  touch-action: manipulation;
  transition: opacity 0.15s ease;
}
.qs-handoff-btn:disabled {
  cursor: default;
  opacity: 0.65;
}
.qs-handoff-status {
  font-size: 12px;
  color: #5C5A56;
  padding: 0 2px;
}
.qs-agent-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  margin-bottom: 4px;
  color: #5C5A56;
}
.qs-human-banner {
  align-self: center;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(10,10,10,0.06);
  color: rgba(10,10,10,0.62);
}
.qs-widget-fab {
  position: fixed;
  bottom: max(16px, env(safe-area-inset-bottom, 0px));
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 28px rgba(10,10,10,0.2);
  z-index: 99999;
  touch-action: manipulation;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.qs-widget-fab:hover {
  transform: scale(1.04);
  box-shadow: 0 10px 32px rgba(10,10,10,0.24);
}
.qs-widget-fab--right {
  right: max(16px, env(safe-area-inset-right, 0px));
}
.qs-widget-fab--left {
  left: max(16px, env(safe-area-inset-left, 0px));
}
.qs-widget-panel {
  position: fixed;
  z-index: 99999;
  display: none;
  flex-direction: column;
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(10,10,10,0.16), 0 0 0 1px rgba(10,10,10,0.06);
  font-family: Outfit, "DM Sans", system-ui, sans-serif;
  width: min(380px, calc(100vw - 32px));
  height: min(
    540px,
    calc(100dvh - 96px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))
  );
  max-height: calc(
    100dvh - 96px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)
  );
  bottom: calc(56px + 16px + env(safe-area-inset-bottom, 0px));
}
.qs-widget-panel--open {
  display: flex;
}
.qs-widget-panel--right {
  right: max(16px, env(safe-area-inset-right, 0px));
}
.qs-widget-panel--left {
  left: max(16px, env(safe-area-inset-left, 0px));
}
.qs-widget-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  background: #ffffff;
  border-bottom: 1px solid rgba(10,10,10,0.06);
  flex-shrink: 0;
}
.qs-widget-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  background: ${CLAY};
}
.qs-widget-input-row {
  display: flex;
  gap: 8px;
  padding: 12px 14px 14px;
  border-top: 1px solid rgba(10,10,10,0.06);
  background: #ffffff;
  flex-shrink: 0;
}
.qs-widget-input-row input {
  min-width: 0;
  flex: 1;
}
.qs-widget-start-form {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  overflow-y: auto;
}
.qs-widget-start-form input,
.qs-widget-input-row input {
  width: 100%;
}
@media (max-width: 480px) {
  .qs-widget-fab {
    width: 52px;
    height: 52px;
    bottom: max(12px, env(safe-area-inset-bottom, 0px));
  }
  .qs-widget-fab--right {
    right: max(12px, env(safe-area-inset-right, 0px));
  }
  .qs-widget-fab--left {
    left: max(12px, env(safe-area-inset-left, 0px));
  }
  .qs-widget-panel,
  .qs-widget-panel--right,
  .qs-widget-panel--left {
    left: max(12px, env(safe-area-inset-left, 0px));
    right: max(12px, env(safe-area-inset-right, 0px));
    width: auto;
    bottom: calc(52px + 12px + env(safe-area-inset-bottom, 0px));
    height: min(
      520px,
      calc(100dvh - 76px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))
    );
    max-height: calc(
      100dvh - 76px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)
    );
    border-radius: 16px;
  }
  .qs-widget-header {
    padding: 14px 16px;
  }
  .qs-widget-messages {
    padding: 12px 14px;
  }
  .qs-widget-input-row {
    padding: 10px 12px 12px;
    gap: 6px;
  }
  .qs-widget-input-row input,
  .qs-widget-start-form input {
    font-size: 16px;
  }
  .qs-widget-start-form {
    padding: 16px;
  }
  .qs-widget-bubble {
    max-width: 92%;
  }
}
@media (max-width: 360px) {
  .qs-widget-send-label {
    display: none;
  }
  .qs-widget-send-btn {
    min-width: 44px;
    padding-left: 12px !important;
    padding-right: 12px !important;
  }
}
@keyframes qs-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.45; }
  30% { transform: translateY(-3px); opacity: 1; }
}
`;

function MessageCircleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.9 20A9 9 0 1 0 4 16.1L2 22l5.9-2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function projectInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "QS";
}

function looksLikeHandoffOffer(text: string): boolean {
  return /connect you with|support team|speak to (a |an )?(human|person|agent|representative)|talk to someone|forward.*(support|agent)|human agent|live agent/i.test(
    text,
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="qs-md" style={{ color: INK }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div
      className="qs-widget-bubble qs-widget-bubble--assistant"
      style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "12px 16px" }}
      aria-label="Assistant is typing"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#5C5A56",
            animation: "qs-bounce 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

export function ChatBot({
  clientId,
  apiUrl = "http://localhost:3100",
  theme = "primary",
  position = "right",
  primaryColor: primaryColorProp,
  token,
}: ChatBotProps) {
  const id = clientId || token || "";
  const [resolvedTheme, setResolvedTheme] = useState<WidgetTheme>(theme);
  const [resolvedPrimary, setResolvedPrimary] = useState(primaryColorProp);
  const [resolvedPosition, setResolvedPosition] = useState(position);

  const client = useMemo(
    () =>
      new QuickStartClient({
        clientId: id,
        apiUrl,
        theme: resolvedTheme,
        position: resolvedPosition,
        primaryColor: resolvedPrimary,
      }),
    [id, apiUrl, resolvedTheme, resolvedPosition, resolvedPrimary],
  );
  const surface = useMemo(
    () => resolveWidgetSurface(resolvedTheme, resolvedPrimary),
    [resolvedTheme, resolvedPrimary],
  );

  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [projectName, setProjectName] = useState("QuickStart AI");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! How can I help you today?" },
  ]);
  const [humanActive, setHumanActive] = useState(false);
  const [handoffPending, setHandoffPending] = useState(false);
  const [handoffBusy, setHandoffBusy] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const agentTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingPing = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (!id) return;
    client
      .getConfig()
      .then((res) => {
        const cfg = res.config;
        if (cfg?.name) setProjectName(cfg.name);
        if (cfg?.welcomeMessage) {
          setMessages([{ role: "assistant", content: cfg.welcomeMessage }]);
        }
        if (cfg?.primaryColor) setResolvedPrimary(cfg.primaryColor);
        if (cfg?.theme && ["primary", "secondary", "tech", "professional"].includes(cfg.theme)) {
          setResolvedTheme(cfg.theme as WidgetTheme);
        }
        if (cfg?.position === "left" || cfg?.position === "right") {
          setResolvedPosition(cfg.position);
        }
      })
      .catch(() => {
        // keep defaults
      });
  }, [client, id]);

  useEffect(() => {
    if (primaryColorProp) setResolvedPrimary(primaryColorProp);
  }, [primaryColorProp]);

  useEffect(() => {
    if (!sessionId) return;

    const reconcile = () => {
      client
        .getSessionMessages(sessionId)
        .then((res) => {
          setHumanActive(res.humanActive);
          setHandoffPending(res.humanPending);
          setMessages(res.messages.map((m) => ({ role: m.role, content: m.content })));
        })
        .catch(() => {
          // Keep whatever is on screen; the next event or reconnect tries again.
        });
    };

    const unsubscribe = client.subscribeToSession(
      sessionId,
      (event) => {
        if (event.type === "connected") {
          setHumanActive(event.humanActive);
          return;
        }
        if (event.type === "human_active") {
          setHumanActive(true);
          setHandoffPending(false);
          setMessages((m) => m.filter((msg) => !msg.streaming));
          setLoading(false);
          return;
        }
        if (event.type === "human_released") {
          setHumanActive(false);
          setAgentTyping(false);
          return;
        }
        if (event.type === "agent_typing") {
          setAgentTyping(true);
          if (agentTypingTimer.current) clearTimeout(agentTypingTimer.current);
          agentTypingTimer.current = setTimeout(() => setAgentTyping(false), 4000);
          return;
        }
        if (event.type === "agent_message") {
          setAgentTyping(false);
          setMessages((m) => [...m, { role: "agent", content: event.content }]);
        }
      },
      reconcile,
    );

    return () => {
      unsubscribe();
      if (agentTypingTimer.current) clearTimeout(agentTypingTimer.current);
    };
  }, [client, sessionId]);

  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(max-width: 480px)");
    if (!mq.matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!id) {
    console.error("QuickStart ChatBot requires clientId");
    return null;
  }

  const start = async () => {
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    try {
      const res = await client.createSession(name.trim(), email.trim());
      setSessionId(res.session.id);
      setStarted(true);
    } catch (e) {
      console.error(e);
      alert("Could not start chat session");
    } finally {
      setLoading(false);
    }
  };

  const notifyTyping = () => {
    if (!humanActive || !sessionId) return;
    const now = Date.now();
    if (now - lastTypingPing.current < 4000) return;
    lastTypingPing.current = now;
    void client.notifyVisitorTyping(sessionId).catch(() => {
      // Presence is cosmetic; never surface a failure to the visitor.
    });
  };

  const confirmHandoff = async () => {
    if (!sessionId || handoffBusy || humanActive) return;
    setHandoffBusy(true);
    try {
      const res = await client.requestHandoff(sessionId);
      setHandoffPending(res.humanPending);
      if (res.humanActive) setHumanActive(true);
    } catch (e) {
      console.error(e);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Could not connect to support right now. Please try again.",
        },
      ]);
    } finally {
      setHandoffBusy(false);
    }
  };

  const send = async () => {
    if (!input.trim() || loading || !sessionId) return;
    const text = input.trim();
    setInput("");
    setMessages((m) =>
      humanActive
        ? [...m, { role: "user", content: text }]
        : [
            ...m,
            { role: "user", content: text },
            { role: "assistant", content: "", streaming: true },
          ],
    );
    setLoading(true);

    try {
      await client.sendMessageStream(sessionId, text, (event) => {
        if (event.type === "token") {
          setMessages((m) => {
            const copy = [...m];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant") {
              copy[copy.length - 1] = {
                ...last,
                content: last.content + event.content,
                streaming: true,
              };
            }
            return copy;
          });
        }
        if (event.type === "done" && event.handoffPending) {
          setHandoffPending(true);
        }
        if (event.type === "meta" && event.humanActive) {
          setHumanActive(true);
        }
      });
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant") {
          copy[copy.length - 1] = { ...last, streaming: false };
        }
        return copy;
      });
    } catch (e) {
      console.error(e);
      const errMsg =
        e instanceof ChatRequestError
          ? e.message
          : e instanceof TypeError && /fetch|network|failed/i.test(e.message)
            ? "Cannot reach the chat server. Check that the API is running and the URL is correct."
            : "Sorry, something went wrong. Please try again.";
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant" && last.streaming) {
          copy[copy.length - 1] = { role: "assistant", content: errMsg, streaming: false };
          return copy;
        }
        return [...copy, { role: "assistant", content: errMsg }];
      });
    } finally {
      setLoading(false);
    }
  };

  const posKey = resolvedPosition === "left" ? "left" : "right";
  const initials = projectInitials(projectName);
  const fabClass = `qs-widget-fab qs-widget-fab--${posKey}`;
  const panelClass = `qs-widget-panel qs-widget-panel--${posKey}${open ? " qs-widget-panel--open" : ""}`;

  const lastAssistantIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === "assistant" && !messages[i]?.streaming) return i;
    }
    return -1;
  })();
  const lastAssistant = lastAssistantIdx >= 0 ? messages[lastAssistantIdx] : null;
  const showHandoffButton =
    !humanActive &&
    !handoffPending &&
    !loading &&
    lastAssistant != null &&
    looksLikeHandoffOffer(lastAssistant.content);

  return (
    <>
      <style>{markdownStyles}</style>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
        className={fabClass}
        style={{
          background: surface.accent.bg,
          color: surface.accent.text,
        }}
      >
        {open ? (
          <span style={{ fontSize: 26, lineHeight: 1, marginTop: -2 }}>×</span>
        ) : (
          <MessageCircleIcon />
        )}
      </button>

      <div
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-label={`${projectName} chat`}
        style={{
          background: surface.panel.bg,
          border: `1px solid ${surface.panel.border}`,
        }}
      >
        <div className="qs-widget-header">
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: INK,
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              flexShrink: 0,
              letterSpacing: "0.02em",
            }}
          >
            {initials}
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 600,
                color: INK,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {projectName}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#5C5A56" }}>Typically replies instantly</p>
          </div>
        </div>

        {!started ? (
          <div className="qs-widget-start-form" style={{ background: surface.panel.bg }}>
            <p style={{ color: "#5C5A56", margin: 0, fontSize: 14 }}>Start a conversation</p>
            <input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle(surface)}
            />
            <input
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle(surface)}
            />
            <button
              type="button"
              onClick={start}
              disabled={loading}
              style={{
                ...sendBtnStyle,
                background: surface.accent.bg,
                color: surface.accent.text,
                width: "100%",
              }}
            >
              {loading ? "Starting…" : "Start chat"}
            </button>
          </div>
        ) : (
          <>
            <div
              className="qs-widget-messages"
            >
              {humanActive && (
                <div className="qs-human-banner">You&rsquo;re connected to a support agent</div>
              )}
              {messages.map((m, i) => {
                const isStreamingEmpty =
                  m.role === "assistant" && m.streaming && !m.content.trim();
                if (isStreamingEmpty) {
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "flex-start" }}>
                      <TypingIndicator />
                    </div>
                  );
                }
                if (m.role === "assistant" && !m.content) return null;
                const isAgent = m.role === "agent";
                return (
                  <React.Fragment key={i}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                        minWidth: 0,
                      }}
                    >
                      <div
                        className={`qs-widget-bubble qs-widget-bubble--${
                          m.role === "user" ? "user" : isAgent ? "agent" : "assistant"
                        }`}
                        style={
                          m.role === "user"
                            ? {
                                background: surface.user.bg,
                                color: surface.user.text,
                              }
                            : {
                                color: surface.assistant.text,
                              }
                        }
                      >
                        {isAgent && <div className="qs-agent-label">Support team</div>}
                        {m.role === "assistant" || isAgent ? (
                          <MarkdownContent content={m.content} />
                        ) : (
                          m.content
                        )}
                      </div>
                    </div>
                    {i === lastAssistantIdx && showHandoffButton && (
                      <div className="qs-handoff-actions">
                        <button
                          type="button"
                          className="qs-handoff-btn"
                          disabled={handoffBusy}
                          onClick={confirmHandoff}
                          style={{
                            background: surface.accent.bg,
                            color: surface.accent.text,
                          }}
                        >
                          {handoffBusy ? "Connecting…" : "Connect to support"}
                        </button>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
              {handoffPending && !humanActive && (
                <div className="qs-handoff-actions">
                  <p className="qs-handoff-status">
                    A support agent has been notified. Please wait — someone will join shortly.
                  </p>
                </div>
              )}
              {agentTyping && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <TypingIndicator />
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="qs-widget-input-row">
              <input
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  notifyTyping();
                }}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Type a message…"
                disabled={loading}
                style={{ ...inputStyle(surface), margin: 0, borderRadius: 9999 }}
              />
              <button
                type="button"
                onClick={send}
                disabled={loading || !input.trim()}
                className="qs-widget-send-btn"
                style={{
                  ...sendBtnStyle,
                  background: surface.accent.bg,
                  color: surface.accent.text,
                  opacity: loading || !input.trim() ? 0.55 : 1,
                }}
              >
                <span className="qs-widget-send-label">Send</span>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function inputStyle(surface: ReturnType<typeof resolveWidgetSurface>): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 10,
    border: `1px solid ${surface.input.border}`,
    background: surface.input.bg,
    color: surface.input.text,
    fontSize: 14,
    outline: "none",
    maxWidth: "100%",
  };
}

const sendBtnStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 9999,
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
  flexShrink: 0,
  touchAction: "manipulation",
};

export default ChatBot;
