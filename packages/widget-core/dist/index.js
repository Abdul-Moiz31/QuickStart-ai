export * from "./triggers/index.js";
export const THEME_COLORS = {
    primary: { bg: "#0B6E4F", accent: "#08A045", text: "#ffffff" },
    secondary: { bg: "#1C2541", accent: "#3A506B", text: "#ffffff" },
    tech: { bg: "#0F172A", accent: "#38BDF8", text: "#ffffff" },
    professional: { bg: "#1B3A4B", accent: "#C9A227", text: "#ffffff" },
};
function contrastText(bg) {
    const hex = bg.replace("#", "");
    const full = hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex.slice(0, 6);
    if (full.length !== 6)
        return "#ffffff";
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.62 ? "#0A0A0A" : "#ffffff";
}
/** Use preset theme colors, optionally overridden by a custom primary color. */
export function resolveWidgetColors(theme, primaryColor) {
    const base = THEME_COLORS[theme] ?? THEME_COLORS.primary;
    const hex = primaryColor?.trim() ?? "";
    if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex))
        return base;
    if (hex.toLowerCase() === base.bg.toLowerCase())
        return base;
    return { bg: hex, accent: hex, text: contrastText(hex) };
}
export class ChatRequestError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = "ChatRequestError";
    }
}
const INK = "#0A0A0A";
const MUTE = "#5C5A56";
const CLAY = "#F7F5F1";
/** Resolve accent used for user bubbles, FAB, and send button. Defaults to ink black. */
export function resolveWidgetAccent(theme, primaryColor) {
    const hex = primaryColor?.trim() ?? "";
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) {
        return { bg: hex, text: contrastText(hex) };
    }
    const preset = THEME_COLORS[theme] ?? THEME_COLORS.primary;
    return { bg: preset.bg, text: preset.text };
}
/** Light clay/ink widget chrome — black accent on user bubbles, not a dark-mode panel. */
export function resolveWidgetSurface(theme, primaryColor) {
    const accent = resolveWidgetAccent(theme, primaryColor);
    const userAccent = primaryColor && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(primaryColor.trim())
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
async function parseErrorResponse(res) {
    try {
        const data = (await res.json());
        return new ChatRequestError(data.message ?? "Failed to send message", data.code);
    }
    catch {
        return new ChatRequestError(`Request failed (${res.status})`);
    }
}
function parseSsePayload(payload) {
    try {
        return JSON.parse(payload);
    }
    catch {
        return null;
    }
}
export class QuickStartClient {
    opts;
    constructor(opts) {
        this.opts = opts;
    }
    headers() {
        return {
            "Content-Type": "application/json",
            "X-Client-Id": this.opts.clientId,
        };
    }
    async getConfig() {
        const res = await fetch(`${this.opts.apiUrl}/api/v1/chat/config`, {
            headers: this.headers(),
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
            body: JSON.stringify(body),
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
            body: JSON.stringify({ sessionId, message, stream: false }),
        });
        if (!res.ok)
            throw await parseErrorResponse(res);
        return res.json();
    }
    async sendMessageStream(sessionId, message, onEvent) {
        const res = await fetch(`${this.opts.apiUrl}/api/v1/chat/message`, {
            method: "POST",
            headers: this.headers(),
            body: JSON.stringify({ sessionId, message, stream: true }),
        });
        if (!res.ok)
            throw await parseErrorResponse(res);
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
            const data = (await res.json());
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
            }
            catch {
                // ignore malformed frames
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
            body: JSON.stringify({}),
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
            headers: { "X-Client-Id": this.opts.clientId },
        });
    }
}
//# sourceMappingURL=index.js.map