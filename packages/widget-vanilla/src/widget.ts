import {
  QuickStartClient,
  resolveWidgetColors,
  TriggerEngine,
  type ProactiveTriggerRule,
  type WidgetTheme,
} from "@quickstart-ai/widget-core";

export interface MountOptions {
  clientId: string;
  apiUrl?: string;
  theme?: WidgetTheme;
  position?: "left" | "right";
  primaryColor?: string;
  target?: HTMLElement | string;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, string> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === "className") node.className = v;
    else if (k === "text") node.textContent = v;
    else node.setAttribute(k, v);
  });
  children.forEach((c) => node.append(typeof c === "string" ? document.createTextNode(c) : c));
  return node;
}

type WidgetPhase = "lead" | "proactive_question" | "proactive_details" | "chat";

export function mountQuickStartChat(opts: MountOptions) {
  const theme = opts.theme ?? "primary";
  const position = opts.position ?? "right";
  const colors = resolveWidgetColors(theme, opts.primaryColor);
  const client = new QuickStartClient({
    clientId: opts.clientId,
    apiUrl: opts.apiUrl ?? "http://localhost:3100",
    theme,
    position,
    primaryColor: opts.primaryColor,
  });

  const host =
    typeof opts.target === "string"
      ? document.querySelector(opts.target)
      : opts.target ?? document.body;
  if (!host) throw new Error("Mount target not found");

  let open = false;
  let sessionId = "";
  let unsubscribe: (() => void) | null = null;
  let loading = false;
  let triggerEngine: TriggerEngine | null = null;
  let proactiveMessage: string | null = null;
  let pendingQuestion: string | null = null;
  let phase: WidgetPhase = "lead";

  const toggle = el("button", { type: "button", "aria-label": "Open chat" }, ["💬"]);
  Object.assign(toggle.style, {
    position: "fixed",
    bottom: "20px",
    [position]: "20px",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    background: colors.bg,
    color: colors.text,
    fontSize: "22px",
    zIndex: "99999",
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
  } as CSSStyleDeclaration);

  const panel = el("div");
  Object.assign(panel.style, {
    position: "fixed",
    bottom: "80px",
    [position]: "20px",
    width: "360px",
    height: "520px",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
    display: "none",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: "99999",
    fontFamily: '"DM Sans", system-ui, sans-serif',
  } as CSSStyleDeclaration);

  const header = el("div", {}, ["QuickStart AI"]);
  Object.assign(header.style, {
    background: colors.bg,
    color: colors.text,
    padding: "14px 16px",
    fontWeight: "600",
  });

  const body = el("div");
  Object.assign(body.style, {
    flex: "1",
    padding: "16px",
    overflowY: "auto",
    background: "#f8fafc",
    display: "none",
  });

  const form = el("div");
  Object.assign(form.style, {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    flex: "1",
  });

  const nameInput = el("input", { placeholder: "Your name" });
  const emailInput = el("input", { placeholder: "Your email", type: "email" });
  const startBtn = el("button", { type: "button" }, ["Start chat"]);
  Object.assign(startBtn.style, {
    background: colors.bg,
    color: colors.text,
    border: "none",
    borderRadius: "8px",
    padding: "12px",
    cursor: "pointer",
    fontWeight: "600",
  });
  [nameInput, emailInput].forEach((i) =>
    Object.assign(i.style, {
      padding: "10px 12px",
      borderRadius: "8px",
      border: "1px solid #cbd5e1",
    }),
  );

  const leadLabel = el("p", { text: "Start a conversation" });
  Object.assign(leadLabel.style, { margin: "0", color: "#64748b", fontSize: "14px" });

  const detailsLabel = el("p", { text: "Tell us who you are so we can reply" });
  Object.assign(detailsLabel.style, { margin: "0", color: "#64748b", fontSize: "14px" });
  detailsLabel.style.display = "none";

  form.append(leadLabel, detailsLabel, nameInput, emailInput, startBtn);

  const composer = el("div");
  Object.assign(composer.style, {
    display: "none",
    flexDirection: "row",
    gap: "8px",
    padding: "12px",
    borderTop: "1px solid #e2e8f0",
  });
  const msgInput = el("input", { placeholder: "Type your question…" });
  Object.assign(msgInput.style, {
    flex: "1",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
  });
  const sendBtn = el("button", { type: "button" }, ["Send"]);
  Object.assign(sendBtn.style, {
    background: colors.bg,
    color: colors.text,
    border: "none",
    borderRadius: "8px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: "600",
  });
  composer.append(msgInput, sendBtn);

  panel.append(header, body, form, composer);
  host.append(toggle, panel);

  function addBubble(role: "user" | "assistant" | "agent", content: string) {
    const wrap = el("div");
    wrap.style.display = "flex";
    wrap.style.justifyContent = role === "user" ? "flex-end" : "flex-start";
    wrap.style.marginBottom = "10px";
    const bubble = el("div");
    Object.assign(bubble.style, {
      maxWidth: "80%",
      padding: "10px 12px",
      borderRadius: "14px",
      background: role === "user" ? colors.bg : role === "agent" ? "#ffffff" : "#e2e8f0",
      color: role === "user" ? colors.text : "#0f172a",
      fontSize: "14px",
      lineHeight: "1.45",
    });
    if (role === "agent") {
      bubble.style.border = `1px solid ${colors.bg}`;
      const label = el("div", { text: "Support Team" });
      Object.assign(label.style, {
        fontSize: "10px",
        fontWeight: "700",
        letterSpacing: "0.3px",
        textTransform: "uppercase",
        marginBottom: "3px",
        color: colors.bg,
      });
      bubble.append(label);
    }
    bubble.append(document.createTextNode(content));
    wrap.append(bubble);
    body.append(wrap);
    body.scrollTop = body.scrollHeight;
  }

  function syncLayout() {
    if (phase === "lead") {
      body.style.display = "none";
      form.style.display = "flex";
      form.style.flex = "1";
      composer.style.display = "none";
      leadLabel.style.display = "block";
      detailsLabel.style.display = "none";
      startBtn.textContent = "Start chat";
      msgInput.placeholder = "Type your question…";
    } else if (phase === "proactive_question") {
      body.style.display = "block";
      form.style.display = "none";
      composer.style.display = "flex";
    } else if (phase === "proactive_details") {
      body.style.display = "block";
      form.style.display = "flex";
      form.style.flex = "0 0 auto";
      composer.style.display = "none";
      leadLabel.style.display = "none";
      detailsLabel.style.display = "block";
      startBtn.textContent = "Continue";
    } else {
      body.style.display = "block";
      form.style.display = "none";
      composer.style.display = "flex";
      msgInput.placeholder = "Type a message…";
    }
  }

  function openPanel() {
    open = true;
    panel.style.display = "flex";
    toggle.textContent = "×";
  }

  toggle.onclick = () => {
    open = !open;
    panel.style.display = open ? "flex" : "none";
    toggle.textContent = open ? "×" : "💬";
    if (open && allowAnonymous && phase === "chat" && body.childElementCount === 0) {
      addBubble("assistant", welcomeMessage);
    }
  };

  function onTriggerFire(rule: ProactiveTriggerRule) {
    proactiveMessage = rule.message;
    pendingQuestion = null;
    phase = "proactive_question";
    body.textContent = "";
    addBubble("assistant", rule.message);
    syncLayout();
    openPanel();
  }

  client
    .getConfig()
    .then((res) => {
      if (res.config.welcomeMessage?.trim()) {
        welcomeMessage = res.config.welcomeMessage.trim();
      }
      if (res.config.allowAnonymousSessions) {
        allowAnonymous = true;
        phase = "chat";
        syncLayout();
      }
      const rules = res.config.proactiveTriggers?.rules;
      if (!rules?.length) return;
      triggerEngine = new TriggerEngine(res.config.proactiveTriggers!, { onFire: onTriggerFire });
      triggerEngine.start();
    })
    .catch(() => {
      // Triggers are an enhancement; a config fetch failure should not block the widget.
    });

  async function sendChatMessage(text: string, skipUserBubble = false) {
    if (!skipUserBubble) addBubble("user", text);
    loading = true;
    try {
      if (!sessionId) {
        sessionId = await client.ensureSession(null);
        phase = "chat";
        triggerEngine?.stop();
        triggerEngine = null;
        syncLayout();
        subscribe();
      }
      const res = await client.sendMessage(sessionId, text);
      if (res.answer) addBubble("assistant", res.answer);
    } catch (e) {
      console.error(e);
      addBubble("assistant", "Sorry, something went wrong.");
    } finally {
      loading = false;
    }
  }

  startBtn.onclick = async () => {
    if (loading) return;
    loading = true;
    startBtn.textContent = phase === "proactive_details" ? "Starting…" : "Starting…";
    try {
      const res = await client.createSession(nameInput.value.trim(), emailInput.value.trim());
      sessionId = res.session.id;
      phase = "chat";
      triggerEngine?.stop();
      triggerEngine = null;
      syncLayout();
      subscribe();

      if (pendingQuestion) {
        const question = pendingQuestion;
        pendingQuestion = null;
        await sendChatMessage(question, true);
      } else if (proactiveMessage && body.textContent === "") {
        addBubble("assistant", proactiveMessage);
      } else if (!proactiveMessage) {
        addBubble("assistant", "Hello! How can I assist you today?");
      }
    } catch (e) {
      console.error(e);
      alert("Could not start chat");
    } finally {
      loading = false;
      startBtn.textContent = phase === "proactive_details" ? "Continue" : "Start chat";
    }
  };

  async function submitProactiveQuestion() {
    const text = msgInput.value.trim();
    if (!text || loading) return;
    msgInput.value = "";
    addBubble("user", text);

    if (allowAnonymous) {
      pendingQuestion = text;
      await sendChatMessage(text, true);
      pendingQuestion = null;
      return;
    }

    pendingQuestion = text;
    phase = "proactive_details";
    triggerEngine?.stop();
    triggerEngine = null;
    syncLayout();
  }

  async function send() {
    const text = msgInput.value.trim();
    if (!text || loading) return;

    if (phase === "proactive_question") {
      await submitProactiveQuestion();
      return;
    }

    if (phase !== "chat" && !allowAnonymous) return;
    msgInput.value = "";
    await sendChatMessage(text);
  }

  let allowAnonymous = false;
  let welcomeMessage = "Hello! How can I assist you today?";

  function subscribe() {
    if (!sessionId || unsubscribe) return;
    unsubscribe = client.subscribeToSession(sessionId, (event) => {
      if (event.type === "agent_message") {
        addBubble("agent", event.content);
        return;
      }
      if (event.type === "human_active") {
        addBubble("assistant", "You're now connected to a support agent.");
        return;
      }
      if (event.type === "human_released") {
        addBubble("assistant", "You're back with the assistant.");
      }
    });
  }

  sendBtn.onclick = () => void send();
  msgInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") void send();
  });

  syncLayout();

  return {
    destroy: () => {
      unsubscribe?.();
      unsubscribe = null;
      triggerEngine?.stop();
      triggerEngine = null;
      toggle.remove();
      panel.remove();
    },
  };
}

function autoMount() {
  const script = document.currentScript as HTMLScriptElement | null;
  const clientId =
    script?.getAttribute("data-client-id") ||
    document.querySelector<HTMLScriptElement>("script[data-quickstart]")?.getAttribute("data-client-id");
  if (!clientId) return;
  const apiUrl = script?.getAttribute("data-api-url") || undefined;
  const theme = (script?.getAttribute("data-theme") as WidgetTheme) || undefined;
  const position = (script?.getAttribute("data-position") as "left" | "right") || undefined;
  const primaryColor = script?.getAttribute("data-primary-color") || undefined;
  mountQuickStartChat({ clientId, apiUrl, theme, position, primaryColor });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoMount);
  } else {
    autoMount();
  }
}

(window as unknown as { QuickStartWidget: { mount: typeof mountQuickStartChat } }).QuickStartWidget = {
  mount: mountQuickStartChat,
};
