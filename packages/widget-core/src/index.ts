import type { ProactiveTriggersConfig } from "./triggers/index.js";
export * from "./triggers/index.js";

export type WidgetTheme = "primary" | "secondary" | "tech" | "professional";

export const THEME_COLORS: Record<WidgetTheme, { bg: string; accent: string; text: string }> = {
  primary: { bg: "#0B6E4F", accent: "#08A045", text: "#ffffff" },
  secondary: { bg: "#1C2541", accent: "#3A506B", text: "#ffffff" },
  tech: { bg: "#0F172A", accent: "#38BDF8", text: "#ffffff" },
  professional: { bg: "#1B3A4B", accent: "#C9A227", text: "#ffffff" },
};

function contrastText(bg: string): string {
  const hex = bg.replace("#", "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex.slice(0, 6);
  if (full.length !== 6) return "#ffffff";
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#0A0A0A" : "#ffffff";
}

/** Use preset theme colors, optionally overridden by a custom primary color. */
export function resolveWidgetColors(theme: WidgetTheme, primaryColor?: string) {
  const base = THEME_COLORS[theme] ?? THEME_COLORS.primary;
  const hex = primaryColor?.trim() ?? "";
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) return base;
  if (hex.toLowerCase() === base.bg.toLowerCase()) return base;
  return { bg: hex, accent: hex, text: contrastText(hex) };
}

export interface WidgetConfig {
  clientId: string;
  apiUrl: string;
  theme?: WidgetTheme;
  position?: "left" | "right";
  primaryColor?: string;
  wantSuggestions?: boolean;
}

export interface ChatMessage {
  /** "agent" is a human replying during a handoff, rendered distinctly from the bot. */
  role: "user" | "assistant" | "agent";
  content: string;
  streaming?: boolean;
}

export type StreamEvent =
  | { type: "meta"; sessionId: string; confidence?: string; humanActive?: boolean }
  | { type: "token"; content: string }
  | { type: "done"; toolsUsed?: string[]; handoffPending?: boolean }
  | { type: "error"; message: string };

/** Pushed on the per-session channel while a human agent is involved. */
export type SessionLiveEvent =
  | { type: "connected"; humanActive: boolean }
  | { type: "agent_message"; content: string; at: string }
  | { type: "human_active" }
  | { type: "human_released" }
  | { type: "agent_typing" };

export class ChatRequestError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ChatRequestError";
  }
}

export interface WidgetSurface {
  accent: { bg: string; text: string };
  panel: { bg: string; border: string };
  messages: { bg: string };
  assistant: { bg: string; text: string };
  user: { bg: string; text: string };
  input: { bg: string; border: string; text: string; placeholder: string };
  isDark: false;
}

const INK = "#0A0A0A";
const MUTE = "#5C5A56";
const CLAY = "#F7F5F1";

/** Resolve accent used for user bubbles, FAB, and send button. Defaults to ink black. */
export function resolveWidgetAccent(theme: WidgetTheme, primaryColor?: string) {
  const hex = primaryColor?.trim() ?? "";
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) {
    return { bg: hex, text: contrastText(hex) };
  }
  const preset = THEME_COLORS[theme] ?? THEME_COLORS.primary;
  return { bg: preset.bg, text: preset.text };
}

/** Light clay/ink widget chrome — black accent on user bubbles, not a dark-mode panel. */
export function resolveWidgetSurface(theme: WidgetTheme, primaryColor?: string): WidgetSurface {
  const accent = resolveWidgetAccent(theme, primaryColor);
  const userAccent =
    primaryColor && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(primaryColor.trim())
      ? accent
      : { bg: INK, text: "#ffffff" };

  return {
    accent: userAccent,
    panel: { bg: "#ffffff", border: "rgba(10,10,10,0.08)" },
    messages: { bg: "#f8fafc" },
    assistant: { bg: CLAY, text: INK },
    user: userAccent,
    input: { bg: "#ffffff", border: "rgba(10,10,10,0.15)", text: INK, placeholder: MUTE },
    isDark: false,
  };
}

async function parseErrorResponse(res: Response): Promise<ChatRequestError> {
  try {
    const data = (await res.json()) as { message?: string; code?: string };
    return new ChatRequestError(data.message ?? "Failed to send message", data.code);
  } catch {
    return new ChatRequestError(`Request failed (${res.status})`);
  }
}

function parseSsePayload(payload: string): StreamEvent | null {
  try {
    return JSON.parse(payload) as StreamEvent;
  } catch {
    return null;
  }
}

export class QuickStartClient {
  constructor(private opts: WidgetConfig) {}

  private headers(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "X-Client-Id": this.opts.clientId,
    };
  }

  async getConfig() {
    const res = await fetch(`${this.opts.apiUrl}/api/v1/chat/config`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error("Failed to load chatbot config");
    return res.json() as Promise<{
      success: boolean;
      config: {
        name: string;
        theme: string;
        position: string;
        primaryColor?: string;
        welcomeMessage?: string;
        proactiveTriggers?: ProactiveTriggersConfig;
        allowAnonymousSessions?: boolean;
        voice?: {
          enabled: boolean;
          provider?: string;
          fallbackMode?: "transcribe" | "text_only";
          language?: string;
          voiceName?: string | null;
        };
      };
    }>;
  }

  async createSession(visitorName?: string, visitorEmail?: string) {
    const body: Record<string, string> = {};
    if (visitorName?.trim()) body.visitorName = visitorName.trim();
    if (visitorEmail?.trim()) body.visitorEmail = visitorEmail.trim();
    const res = await fetch(`${this.opts.apiUrl}/api/v1/chat/session`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Failed to create session");
    return res.json() as Promise<{ success: boolean; session: { id: string } }>;
  }

  /** Create a session on first message when none exists yet. */
  async ensureSession(
    existingSessionId: string | null | undefined,
    visitorName?: string,
    visitorEmail?: string,
  ): Promise<string> {
    if (existingSessionId) return existingSessionId;
    const res = await this.createSession(visitorName, visitorEmail);
    return res.session.id;
  }

  async sendMessage(sessionId: string, message: string) {
    const res = await fetch(`${this.opts.apiUrl}/api/v1/chat/message`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ sessionId, message, stream: false }),
    });
    if (!res.ok) throw await parseErrorResponse(res);
    return res.json() as Promise<{
      success: boolean;
      answer: string;
      sessionId: string;
      confidence?: string;
    }>;
  }

  async sendMessageStream(
    sessionId: string,
    message: string,
    onEvent: (event: StreamEvent) => void,
  ): Promise<void> {
    const res = await fetch(`${this.opts.apiUrl}/api/v1/chat/message`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ sessionId, message, stream: true }),
    });
    if (!res.ok) throw await parseErrorResponse(res);

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data = (await res.json()) as {
        success: boolean;
        answer?: string;
        sessionId: string;
        confidence?: string;
        message?: string;
        code?: string;
      };
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

    if (!res.body) throw new ChatRequestError("No response body");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const flushLine = (line: string) => {
      if (!line.startsWith("data: ")) return;
      const payload = line.slice(6).trim();
      if (!payload) return;
      const event = parseSsePayload(payload);
      if (!event) return;
      onEvent(event);
      if (event.type === "error") {
        throw new ChatRequestError(event.message, "CHAT_FAILED");
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) flushLine(line);
    }
    if (buffer.trim()) flushLine(buffer.trim());
  }

  /** Sends a recorded audio clip for transcription; returns the recognized text. */
  async transcribeAudio(sessionId: string | undefined, audioBase64: string, mimeType: string) {
    const res = await fetch(`${this.opts.apiUrl}/api/v1/voice/transcribe`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ sessionId, audioBase64, mimeType }),
    });
    if (!res.ok) throw await parseErrorResponse(res);
    return res.json() as Promise<{ success: boolean; text: string }>;
  }

  /** Start a Gemini Live voice session — returns ephemeral token + connect hints. */
  async createVoiceSession(chatSessionId?: string, resumptionHandle?: string) {
    const res = await fetch(`${this.opts.apiUrl}/api/v1/voice/session`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ chatSessionId, resumptionHandle }),
    });
    if (!res.ok) throw await parseErrorResponse(res);
    const data = (await res.json()) as {
      success: boolean;
      session: {
        voiceSessionId: string;
        chatSessionId: string | null;
        provider: string;
        ephemeralToken: string;
        model: string;
        expiresAt: string;
        fallbackMode: "transcribe" | "text_only";
        connect: {
          useEphemeralToken: boolean;
          responseModalities: string[];
          language: string;
          voiceName: string | null;
        };
      };
    };
    const s = data.session;
    return {
      voiceSessionId: s.voiceSessionId,
      chatSessionId: s.chatSessionId,
      provider: s.provider,
      ephemeralToken: s.ephemeralToken,
      model: s.model,
      expiresAt: s.expiresAt,
      fallbackMode: s.fallbackMode,
      connect: s.connect,
    };
  }

  async voiceHeartbeat(voiceSessionId: string, resumptionHandle?: string) {
    const res = await fetch(`${this.opts.apiUrl}/api/v1/voice/session/${voiceSessionId}/heartbeat`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ resumptionHandle }),
    });
    if (!res.ok) throw await parseErrorResponse(res);
  }

  async endVoiceSession(voiceSessionId: string, reason?: "user" | "error" | "timeout") {
    const res = await fetch(`${this.opts.apiUrl}/api/v1/voice/session/${voiceSessionId}/end`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw await parseErrorResponse(res);
  }

  async executeVoiceTool(
    voiceSessionId: string,
    call: { id: string; name: string; args: Record<string, unknown> },
  ) {
    const res = await fetch(`${this.opts.apiUrl}/api/v1/voice/tools/execute`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        voiceSessionId,
        toolCallId: call.id,
        toolName: call.name,
        args: call.args,
      }),
    });
    if (!res.ok) throw await parseErrorResponse(res);
    const data = (await res.json()) as {
      success: boolean;
      output: unknown;
      actions?: { stopVoice?: boolean; humanPending?: boolean };
    };
    return { output: data.output, actions: data.actions };
  }

  async appendVoiceTranscript(input: {
    chatSessionId: string;
    voiceSessionId?: string;
    role: "user" | "assistant";
    content: string;
  }) {
    const res = await fetch(`${this.opts.apiUrl}/api/v1/voice/transcript`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(input),
    });
    if (!res.ok) throw await parseErrorResponse(res);
  }

  async getSessionMessages(sessionId: string) {
    const url = new URL(`${this.opts.apiUrl}/api/v1/chat/sessions/${sessionId}/messages`);
    url.searchParams.set("clientId", this.opts.clientId);
    const res = await fetch(url.toString(), { headers: this.headers() });
    if (!res.ok) throw await parseErrorResponse(res);
    return res.json() as Promise<{
      success: boolean;
      humanActive: boolean;
      humanPending: boolean;
      messages: { role: ChatMessage["role"]; content: string }[];
    }>;
  }

  subscribeToSession(
    sessionId: string,
    onEvent: (event: SessionLiveEvent) => void,
    onReconnect?: () => void,
  ): () => void {
    const url = new URL(`${this.opts.apiUrl}/api/v1/chat/sessions/${sessionId}/stream`);
    url.searchParams.set("clientId", this.opts.clientId);

    let source: EventSource | null = new EventSource(url.toString());
    let sawOpen = false;

    source.onopen = () => {
      if (sawOpen) onReconnect?.();
      sawOpen = true;
    };
    source.onmessage = (ev: MessageEvent<string>) => {
      try {
        onEvent(JSON.parse(ev.data) as SessionLiveEvent);
      } catch {
        // ignore malformed frames
      }
    };

    return () => {
      source?.close();
      source = null;
    };
  }

  async requestHandoff(sessionId: string) {
    const url = new URL(`${this.opts.apiUrl}/api/v1/chat/sessions/${sessionId}/request-handoff`);
    url.searchParams.set("clientId", this.opts.clientId);
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({}),
    });
    if (!res.ok) throw await parseErrorResponse(res);
    return res.json() as Promise<{
      success: boolean;
      humanPending: boolean;
      humanActive?: boolean;
    }>;
  }

  async notifyVisitorTyping(sessionId: string): Promise<void> {
    const url = new URL(`${this.opts.apiUrl}/api/v1/chat/sessions/${sessionId}/typing`);
    url.searchParams.set("clientId", this.opts.clientId);
    await fetch(url.toString(), {
      method: "POST",
      headers: { "X-Client-Id": this.opts.clientId },
    });
  }
}
