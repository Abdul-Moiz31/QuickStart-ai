"use strict";
var QuickStartWidget = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/widget.ts
  var widget_exports = {};
  __export(widget_exports, {
    mountQuickStartChat: () => mountQuickStartChat
  });

  // ../widget-core/dist/triggers/evaluate.js
  function matchesUrlPattern(pathname, pattern) {
    if (pattern.includes("*")) {
      const escaped = pattern.split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*");
      return new RegExp(`^${escaped}$`).test(pathname);
    }
    return pathname === pattern || pathname.startsWith(pattern.endsWith("/") ? pattern : `${pattern}/`);
  }
  function evaluateCondition(condition, state) {
    switch (condition.type) {
      case "time_on_page":
        return state.elapsedSeconds >= condition.seconds;
      case "idle":
        return state.idleSeconds >= condition.seconds;
      case "url_match":
        return matchesUrlPattern(state.pathname, condition.pattern);
      case "scroll_depth":
        return state.scrollPercent >= condition.percent;
      case "exit_intent":
        return state.exitIntent;
    }
  }
  function evaluateRule(rule, state) {
    if (rule.enabled === false)
      return false;
    if (rule.conditions.length === 0)
      return false;
    return rule.conditions.every((condition) => evaluateCondition(condition, state));
  }

  // ../widget-core/dist/triggers/storage.js
  var SESSION_FIRED_PREFIX = "qs_trigger_fired:";
  var DAILY_COUNT_KEY = "qs_trigger_daily_count";
  function todayKey(now) {
    return new Date(now).toISOString().slice(0, 10);
  }
  function hasFiredThisSession(storage, ruleId) {
    return storage.getItem(SESSION_FIRED_PREFIX + ruleId) === "1";
  }
  function markFiredThisSession(storage, ruleId) {
    storage.setItem(SESSION_FIRED_PREFIX + ruleId, "1");
  }
  function readDailyCount(storage, now) {
    const raw = storage.getItem(DAILY_COUNT_KEY);
    if (!raw)
      return { date: todayKey(now), count: 0 };
    try {
      const parsed = JSON.parse(raw);
      if (parsed.date !== todayKey(now))
        return { date: todayKey(now), count: 0 };
      return parsed;
    } catch {
      return { date: todayKey(now), count: 0 };
    }
  }
  function isDailyCapExceeded(storage, maxPerDay, now) {
    return readDailyCount(storage, now).count >= maxPerDay;
  }
  function recordDailyFire(storage, now) {
    const current = readDailyCount(storage, now);
    const next = { date: current.date, count: current.count + 1 };
    storage.setItem(DAILY_COUNT_KEY, JSON.stringify(next));
  }

  // ../widget-core/dist/triggers/engine.js
  var TICK_MS = 500;
  var MOBILE_EXIT_SCROLL_DELTA = 80;
  var MOBILE_EXIT_SCROLL_MAX_Y = 400;
  var TriggerEngine = class {
    rules;
    maxFiresPerDay;
    onFire;
    session;
    local;
    now;
    startedAt = 0;
    lastActivityAt = 0;
    exitIntent = false;
    lastScrollY = 0;
    tickHandle = null;
    firedRuleIds = /* @__PURE__ */ new Set();
    handleMouseOut = (e) => {
      if (e.clientY <= 0 && !e.relatedTarget)
        this.exitIntent = true;
    };
    handleActivity = () => {
      this.lastActivityAt = this.now();
    };
    handleScroll = () => {
      this.handleActivity();
      const y = window.scrollY;
      if (y < this.lastScrollY - MOBILE_EXIT_SCROLL_DELTA && y < MOBILE_EXIT_SCROLL_MAX_Y) {
        this.exitIntent = true;
      }
      this.lastScrollY = y;
    };
    constructor(config, options) {
      this.rules = config.rules;
      this.maxFiresPerDay = config.maxFiresPerDay ?? 3;
      this.onFire = options.onFire;
      this.session = options.sessionStorage ?? (typeof window !== "undefined" ? window.sessionStorage : void 0);
      this.local = options.localStorage ?? (typeof window !== "undefined" ? window.localStorage : void 0);
      this.now = options.now ?? (() => Date.now());
    }
    start() {
      if (this.tickHandle)
        return;
      if (typeof window === "undefined" || typeof document === "undefined")
        return;
      if (this.rules.length === 0)
        return;
      this.startedAt = this.now();
      this.lastActivityAt = this.startedAt;
      this.lastScrollY = window.scrollY;
      this.exitIntent = false;
      for (const rule of this.rules) {
        if (hasFiredThisSession(this.session, rule.id))
          this.firedRuleIds.add(rule.id);
      }
      document.addEventListener("mouseout", this.handleMouseOut);
      window.addEventListener("scroll", this.handleScroll, { passive: true });
      window.addEventListener("mousemove", this.handleActivity);
      window.addEventListener("keydown", this.handleActivity);
      window.addEventListener("touchstart", this.handleActivity, { passive: true });
      this.tickHandle = setInterval(() => this.tick(), TICK_MS);
      this.tick();
    }
    stop() {
      if (this.tickHandle)
        clearInterval(this.tickHandle);
      this.tickHandle = null;
      if (typeof window === "undefined" || typeof document === "undefined")
        return;
      document.removeEventListener("mouseout", this.handleMouseOut);
      window.removeEventListener("scroll", this.handleScroll);
      window.removeEventListener("mousemove", this.handleActivity);
      window.removeEventListener("keydown", this.handleActivity);
      window.removeEventListener("touchstart", this.handleActivity);
    }
    currentState() {
      const now = this.now();
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const scrollPercent = scrollable > 0 ? Math.min(100, window.scrollY / scrollable * 100) : 0;
      return {
        elapsedSeconds: (now - this.startedAt) / 1e3,
        idleSeconds: (now - this.lastActivityAt) / 1e3,
        pathname: window.location.pathname,
        scrollPercent,
        exitIntent: this.exitIntent
      };
    }
    tick() {
      const state = this.currentState();
      for (const rule of this.rules) {
        if (this.firedRuleIds.has(rule.id))
          continue;
        if (!evaluateRule(rule, state))
          continue;
        if (isDailyCapExceeded(this.local, this.maxFiresPerDay, this.now()))
          continue;
        this.firedRuleIds.add(rule.id);
        markFiredThisSession(this.session, rule.id);
        recordDailyFire(this.local, this.now());
        this.onFire(rule);
      }
    }
  };

  // ../widget-core/dist/index.js
  var THEME_COLORS = {
    primary: { bg: "#0B6E4F", accent: "#08A045", text: "#ffffff" },
    secondary: { bg: "#1C2541", accent: "#3A506B", text: "#ffffff" },
    tech: { bg: "#0F172A", accent: "#38BDF8", text: "#ffffff" },
    professional: { bg: "#1B3A4B", accent: "#C9A227", text: "#ffffff" }
  };
  function contrastText(bg) {
    const hex = bg.replace("#", "");
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex.slice(0, 6);
    if (full.length !== 6)
      return "#ffffff";
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.62 ? "#0A0A0A" : "#ffffff";
  }
  function resolveWidgetColors(theme, primaryColor) {
    const base = THEME_COLORS[theme] ?? THEME_COLORS.primary;
    const hex = primaryColor?.trim() ?? "";
    if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex))
      return base;
    if (hex.toLowerCase() === base.bg.toLowerCase())
      return base;
    return { bg: hex, accent: hex, text: contrastText(hex) };
  }
  var ChatRequestError = class extends Error {
    code;
    constructor(message, code) {
      super(message);
      this.code = code;
      this.name = "ChatRequestError";
    }
  };
  async function parseErrorResponse(res) {
    try {
      const data = await res.json();
      return new ChatRequestError(data.message ?? "Failed to send message", data.code);
    } catch {
      return new ChatRequestError(`Request failed (${res.status})`);
    }
  }
  function parseSsePayload(payload) {
    try {
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }
  var QuickStartClient = class {
    opts;
    constructor(opts) {
      this.opts = opts;
    }
    headers() {
      return {
        "Content-Type": "application/json",
        "X-Client-Id": this.opts.clientId
      };
    }
    async getConfig() {
      const res = await fetch(`${this.opts.apiUrl}/api/v1/chat/config`, {
        headers: this.headers()
      });
      if (!res.ok)
        throw new Error("Failed to load chatbot config");
      return res.json();
    }
    async createSession(visitorName, visitorEmail) {
      const body = {};
      if (visitorName?.trim())
        body.visitorName = visitorName.trim();
      if (visitorEmail?.trim())
        body.visitorEmail = visitorEmail.trim();
      const res = await fetch(`${this.opts.apiUrl}/api/v1/chat/session`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(body)
      });
      if (!res.ok)
        throw new Error("Failed to create session");
      return res.json();
    }
    /** Create a session on first message when none exists yet. */
    async ensureSession(existingSessionId, visitorName, visitorEmail) {
      if (existingSessionId)
        return existingSessionId;
      const res = await this.createSession(visitorName, visitorEmail);
      return res.session.id;
    }
    async sendMessage(sessionId, message) {
      const res = await fetch(`${this.opts.apiUrl}/api/v1/chat/message`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({ sessionId, message, stream: false })
      });
      if (!res.ok)
        throw await parseErrorResponse(res);
      return res.json();
    }
    async sendMessageStream(sessionId, message, onEvent) {
      const res = await fetch(`${this.opts.apiUrl}/api/v1/chat/message`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({ sessionId, message, stream: true })
      });
      if (!res.ok)
        throw await parseErrorResponse(res);
      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (!data.success) {
          throw new ChatRequestError(data.message ?? "Failed to send message", data.code);
        }
        onEvent({ type: "meta", sessionId: data.sessionId, confidence: data.confidence });
        const answer = data.answer ?? "";
        const parts = answer.match(/\S+\s*|\s+/g) ?? [answer];
        for (const part of parts) {
          onEvent({ type: "token", content: part });
        }
        onEvent({ type: "done" });
        return;
      }
      if (!res.body)
        throw new ChatRequestError("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const flushLine = (line) => {
        if (!line.startsWith("data: "))
          return;
        const payload = line.slice(6).trim();
        if (!payload)
          return;
        const event = parseSsePayload(payload);
        if (!event)
          return;
        onEvent(event);
        if (event.type === "error") {
          throw new ChatRequestError(event.message, "CHAT_FAILED");
        }
      };
      while (true) {
        const { done, value } = await reader.read();
        if (done)
          break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines)
          flushLine(line);
      }
      if (buffer.trim())
        flushLine(buffer.trim());
    }
    async getSessionMessages(sessionId) {
      const url = new URL(`${this.opts.apiUrl}/api/v1/chat/sessions/${sessionId}/messages`);
      url.searchParams.set("clientId", this.opts.clientId);
      const res = await fetch(url.toString(), { headers: this.headers() });
      if (!res.ok)
        throw await parseErrorResponse(res);
      return res.json();
    }
    subscribeToSession(sessionId, onEvent, onReconnect) {
      const url = new URL(`${this.opts.apiUrl}/api/v1/chat/sessions/${sessionId}/stream`);
      url.searchParams.set("clientId", this.opts.clientId);
      let source = new EventSource(url.toString());
      let sawOpen = false;
      source.onopen = () => {
        if (sawOpen)
          onReconnect?.();
        sawOpen = true;
      };
      source.onmessage = (ev) => {
        try {
          onEvent(JSON.parse(ev.data));
        } catch {
        }
      };
      return () => {
        source?.close();
        source = null;
      };
    }
    async requestHandoff(sessionId) {
      const url = new URL(`${this.opts.apiUrl}/api/v1/chat/sessions/${sessionId}/request-handoff`);
      url.searchParams.set("clientId", this.opts.clientId);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({})
      });
      if (!res.ok)
        throw await parseErrorResponse(res);
      return res.json();
    }
    async notifyVisitorTyping(sessionId) {
      const url = new URL(`${this.opts.apiUrl}/api/v1/chat/sessions/${sessionId}/typing`);
      url.searchParams.set("clientId", this.opts.clientId);
      await fetch(url.toString(), {
        method: "POST",
        headers: { "X-Client-Id": this.opts.clientId }
      });
    }
  };

  // src/widget.ts
  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === "className") node.className = v;
      else if (k === "text") node.textContent = v;
      else node.setAttribute(k, v);
    });
    children.forEach((c) => node.append(typeof c === "string" ? document.createTextNode(c) : c));
    return node;
  }
  function mountQuickStartChat(opts) {
    const theme = opts.theme ?? "primary";
    const position = opts.position ?? "right";
    const colors = resolveWidgetColors(theme, opts.primaryColor);
    const client = new QuickStartClient({
      clientId: opts.clientId,
      apiUrl: opts.apiUrl ?? "http://localhost:3100",
      theme,
      position,
      primaryColor: opts.primaryColor
    });
    const host = typeof opts.target === "string" ? document.querySelector(opts.target) : opts.target ?? document.body;
    if (!host) throw new Error("Mount target not found");
    let open = false;
    let sessionId = "";
    let unsubscribe = null;
    let loading = false;
    let triggerEngine = null;
    let proactiveMessage = null;
    let pendingQuestion = null;
    let phase = "lead";
    const toggle = el("button", { type: "button", "aria-label": "Open chat" }, ["\u{1F4AC}"]);
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
      boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
    });
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
      fontFamily: '"DM Sans", system-ui, sans-serif'
    });
    const header = el("div", {}, ["QuickStart AI"]);
    Object.assign(header.style, {
      background: colors.bg,
      color: colors.text,
      padding: "14px 16px",
      fontWeight: "600"
    });
    const body = el("div");
    Object.assign(body.style, {
      flex: "1",
      padding: "16px",
      overflowY: "auto",
      background: "#f8fafc",
      display: "none"
    });
    const form = el("div");
    Object.assign(form.style, {
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      flex: "1"
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
      fontWeight: "600"
    });
    [nameInput, emailInput].forEach(
      (i) => Object.assign(i.style, {
        padding: "10px 12px",
        borderRadius: "8px",
        border: "1px solid #cbd5e1"
      })
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
      borderTop: "1px solid #e2e8f0"
    });
    const msgInput = el("input", { placeholder: "Type your question\u2026" });
    Object.assign(msgInput.style, {
      flex: "1",
      padding: "10px 12px",
      borderRadius: "8px",
      border: "1px solid #cbd5e1"
    });
    const sendBtn = el("button", { type: "button" }, ["Send"]);
    Object.assign(sendBtn.style, {
      background: colors.bg,
      color: colors.text,
      border: "none",
      borderRadius: "8px",
      padding: "10px 14px",
      cursor: "pointer",
      fontWeight: "600"
    });
    composer.append(msgInput, sendBtn);
    panel.append(header, body, form, composer);
    host.append(toggle, panel);
    function addBubble(role, content) {
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
        lineHeight: "1.45"
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
          color: colors.bg
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
        msgInput.placeholder = "Type your question\u2026";
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
        msgInput.placeholder = "Type a message\u2026";
      }
    }
    function openPanel() {
      open = true;
      panel.style.display = "flex";
      toggle.textContent = "\xD7";
    }
    toggle.onclick = () => {
      open = !open;
      panel.style.display = open ? "flex" : "none";
      toggle.textContent = open ? "\xD7" : "\u{1F4AC}";
      if (open && allowAnonymous && phase === "chat" && body.childElementCount === 0) {
        addBubble("assistant", welcomeMessage);
      }
    };
    function onTriggerFire(rule) {
      proactiveMessage = rule.message;
      pendingQuestion = null;
      phase = "proactive_question";
      body.textContent = "";
      addBubble("assistant", rule.message);
      syncLayout();
      openPanel();
    }
    client.getConfig().then((res) => {
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
      triggerEngine = new TriggerEngine(res.config.proactiveTriggers, { onFire: onTriggerFire });
      triggerEngine.start();
    }).catch(() => {
    });
    async function sendChatMessage(text, skipUserBubble = false) {
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
      startBtn.textContent = phase === "proactive_details" ? "Starting\u2026" : "Starting\u2026";
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
      }
    };
  }
  function autoMount() {
    const script = document.currentScript;
    const clientId = script?.getAttribute("data-client-id") || document.querySelector("script[data-quickstart]")?.getAttribute("data-client-id");
    if (!clientId) return;
    const apiUrl = script?.getAttribute("data-api-url") || void 0;
    const theme = script?.getAttribute("data-theme") || void 0;
    const position = script?.getAttribute("data-position") || void 0;
    const primaryColor = script?.getAttribute("data-primary-color") || void 0;
    mountQuickStartChat({ clientId, apiUrl, theme, position, primaryColor });
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", autoMount);
    } else {
      autoMount();
    }
  }
  window.QuickStartWidget = {
    mount: mountQuickStartChat
  };
  return __toCommonJS(widget_exports);
})();
