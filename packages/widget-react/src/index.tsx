import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChatRequestError,
  QuickStartClient,
  resolveWidgetSurface,
  TriggerEngine,
  type ChatMessage,
  type ProactiveTriggersConfig,
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
.qs-md { font-size: 13px; line-height: 1.5; word-break: break-word; overflow-wrap: anywhere; }
.qs-md p { margin: 0 0 0.45em; }
.qs-md p:last-child { margin-bottom: 0; }
.qs-md ul, .qs-md ol { margin: 0.3em 0 0.45em; padding-left: 1.2em; }
.qs-md li { margin: 0.15em 0; }
.qs-md strong { font-weight: 600; }
.qs-md a { color: inherit; text-decoration: underline; }
.qs-md code { font-size: 0.88em; padding: 0.1em 0.35em; border-radius: 4px; background: rgba(10,10,10,0.08); }
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
  box-shadow: 0 8px 24px rgba(10,10,10,0.22);
  z-index: 99999;
  touch-action: manipulation;
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
  border-radius: 16px;
  box-shadow: 0 16px 40px rgba(10,10,10,0.14);
  font-family: Outfit, "DM Sans", system-ui, sans-serif;
  width: min(360px, calc(100vw - 32px));
  height: min(
    520px,
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
  gap: 10px;
  padding: 14px 16px;
  background: #ffffff;
  border-bottom: 1px solid rgba(10,10,10,0.06);
  flex-shrink: 0;
}
.qs-widget-messages {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
.qs-widget-input-row {
  display: flex;
  gap: 8px;
  padding: 12px;
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
    border-radius: 14px;
  }
  .qs-widget-header {
    padding: 12px 14px;
  }
  .qs-widget-messages {
    padding: 10px 12px;
  }
  .qs-widget-input-row {
    padding: 10px;
    gap: 6px;
  }
  .qs-widget-input-row input,
  .qs-widget-start-form input {
    font-size: 16px;
  }
  .qs-widget-start-form {
    padding: 16px;
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

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="qs-md" style={{ color: INK }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

function TypingIndicator({ bg }: { bg: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "10px 14px",
        borderRadius: 16,
        borderTopLeftRadius: 4,
        background: bg,
      }}
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
  const [proactiveTriggers, setProactiveTriggers] = useState<ProactiveTriggersConfig | null>(null);
  const [proactiveMessage, setProactiveMessage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! How can I assist you today?" },
  ]);
  const [humanActive, setHumanActive] = useState(false);
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
        if (cfg?.proactiveTriggers?.rules?.length) {
          setProactiveTriggers(cfg.proactiveTriggers);
        }
      })
      .catch(() => {
        // keep defaults
      });
  }, [client, id]);

  // Torn down once the visitor engages (started) — no need to keep watching page
  // signals for someone who is already talking to the bot.
  useEffect(() => {
    if (!proactiveTriggers || started) return;
    const engine = new TriggerEngine(proactiveTriggers, {
      onFire: (rule) => {
        setProactiveMessage(rule.message);
        setOpen(true);
      },
    });
    engine.start();
    return () => engine.stop();
  }, [proactiveTriggers, started]);

  useEffect(() => {
    if (primaryColorProp) setResolvedPrimary(primaryColorProp);
  }, [primaryColorProp]);

  // Live channel for agent replies and handoff status, torn down with the session.
  useEffect(() => {
    if (!sessionId) return;

    const reconcile = () => {
      client
        .getSessionMessages(sessionId)
        .then((res) => {
          setHumanActive(res.humanActive);
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
          // A bot answer may have been mid-flight; it was superseded before
          // delivery, so drop the half-rendered bubble.
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
      // Cosmetic-only until now — the proactive line becomes the real conversation
      // opener the moment the visitor actually engages.
      if (proactiveMessage) {
        setMessages((m) => [{ role: "assistant", content: proactiveMessage }, ...m.slice(1)]);
      }
    } catch (e) {
      console.error(e);
      alert("Could not start chat session");
    } finally {
      setLoading(false);
    }
  };

  /**
   * One HTTP call per ping, so it fires only while a human is reading and at most
   * every 4s — unthrottled it would eat the rate limit the visitor's real messages
   * depend on.
   */
  const notifyTyping = () => {
    if (!humanActive || !sessionId) return;
    const now = Date.now();
    if (now - lastTypingPing.current < 4000) return;
    lastTypingPing.current = now;
    void client.notifyVisitorTyping(sessionId).catch(() => {
      // Presence is cosmetic; never surface a failure to the visitor.
    });
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
              width: 32,
              height: 32,
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
            {proactiveMessage && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    maxWidth: "88%",
                    padding: "8px 12px",
                    fontSize: 13,
                    lineHeight: 1.5,
                    borderRadius: 16,
                    borderTopLeftRadius: 4,
                    background: surface.assistant.bg,
                    color: surface.assistant.text,
                  }}
                >
                  {proactiveMessage}
                </div>
              </div>
            )}
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
              style={{ background: surface.messages.bg }}
            >
              {humanActive && (
                <div
                  style={{
                    alignSelf: "center",
                    padding: "4px 10px",
                    borderRadius: 9999,
                    fontSize: 11,
                    fontWeight: 600,
                    background: "rgba(10,10,10,0.06)",
                    color: "rgba(10,10,10,0.62)",
                  }}
                >
                  You&rsquo;re connected to a support agent
                </div>
              )}
              {messages.map((m, i) => {
                const isStreamingEmpty =
                  m.role === "assistant" && m.streaming && !m.content.trim();
                if (isStreamingEmpty) {
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "flex-start" }}>
                      <TypingIndicator bg={surface.assistant.bg} />
                    </div>
                  );
                }
                if (m.role === "assistant" && !m.content) return null;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "88%",
                        padding: "8px 12px",
                        fontSize: 13,
                        lineHeight: 1.5,
                        ...(m.role === "user"
                          ? {
                              borderRadius: 9999,
                              background: surface.user.bg,
                              color: surface.user.text,
                            }
                          : m.role === "agent"
                            ? {
                                borderRadius: 16,
                                borderTopLeftRadius: 4,
                                background: "#ffffff",
                                color: surface.assistant.text,
                                border: `1px solid ${surface.accent.bg}`,
                              }
                            : {
                                borderRadius: 16,
                                borderTopLeftRadius: 4,
                                background: surface.assistant.bg,
                                color: surface.assistant.text,
                              }),
                      }}
                    >
                      {m.role === "agent" && (
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: 0.3,
                            textTransform: "uppercase",
                            marginBottom: 3,
                            color: surface.accent.bg,
                          }}
                        >
                          Support Team
                        </div>
                      )}
                      {m.role === "assistant" ? (
                        <MarkdownContent content={m.content} />
                      ) : (
                        m.content
                      )}
                    </div>
                  </div>
                );
              })}
              {agentTyping && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <TypingIndicator bg={surface.assistant.bg} />
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
  borderRadius: 10,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
  flexShrink: 0,
  touchAction: "manipulation",
};

export default ChatBot;
