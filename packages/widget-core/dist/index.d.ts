import type { ProactiveTriggersConfig } from "./triggers/index.js";
export * from "./triggers/index.js";
export type WidgetTheme = "primary" | "secondary" | "tech" | "professional";
export declare const THEME_COLORS: Record<WidgetTheme, {
    bg: string;
    accent: string;
    text: string;
}>;
/** Use preset theme colors, optionally overridden by a custom primary color. */
export declare function resolveWidgetColors(theme: WidgetTheme, primaryColor?: string): {
    bg: string;
    accent: string;
    text: string;
};
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
export type StreamEvent = {
    type: "meta";
    sessionId: string;
    confidence?: string;
    humanActive?: boolean;
} | {
    type: "token";
    content: string;
} | {
    type: "done";
    toolsUsed?: string[];
    handoffPending?: boolean;
} | {
    type: "error";
    message: string;
};
/** Pushed on the per-session channel while a human agent is involved. */
export type SessionLiveEvent = {
    type: "connected";
    humanActive: boolean;
} | {
    type: "agent_message";
    content: string;
    at: string;
} | {
    type: "human_active";
} | {
    type: "human_released";
} | {
    type: "agent_typing";
};
export declare class ChatRequestError extends Error {
    code?: string | undefined;
    constructor(message: string, code?: string | undefined);
}
export interface WidgetSurface {
    accent: {
        bg: string;
        text: string;
    };
    panel: {
        bg: string;
        border: string;
    };
    messages: {
        bg: string;
    };
    assistant: {
        bg: string;
        text: string;
    };
    user: {
        bg: string;
        text: string;
    };
    input: {
        bg: string;
        border: string;
        text: string;
        placeholder: string;
    };
    isDark: false;
}
/** Resolve accent used for user bubbles, FAB, and send button. Defaults to ink black. */
export declare function resolveWidgetAccent(theme: WidgetTheme, primaryColor?: string): {
    bg: string;
    text: string;
};
/** Light clay/ink widget chrome — black accent on user bubbles, not a dark-mode panel. */
export declare function resolveWidgetSurface(theme: WidgetTheme, primaryColor?: string): WidgetSurface;
export declare class QuickStartClient {
    private opts;
    constructor(opts: WidgetConfig);
    private headers;
    getConfig(): Promise<{
        success: boolean;
        config: {
            name: string;
            theme: string;
            position: string;
            primaryColor?: string;
            welcomeMessage?: string;
            proactiveTriggers?: ProactiveTriggersConfig;
            allowAnonymousSessions?: boolean;
        };
    }>;
    createSession(visitorName?: string, visitorEmail?: string): Promise<{
        success: boolean;
        session: {
            id: string;
        };
    }>;
    /** Create a session on first message when none exists yet. */
    ensureSession(existingSessionId: string | null | undefined, visitorName?: string, visitorEmail?: string): Promise<string>;
    sendMessage(sessionId: string, message: string): Promise<{
        success: boolean;
        answer: string;
        sessionId: string;
        confidence?: string;
    }>;
    sendMessageStream(sessionId: string, message: string, onEvent: (event: StreamEvent) => void): Promise<void>;
    getSessionMessages(sessionId: string): Promise<{
        success: boolean;
        humanActive: boolean;
        humanPending: boolean;
        messages: {
            role: ChatMessage["role"];
            content: string;
        }[];
    }>;
    subscribeToSession(sessionId: string, onEvent: (event: SessionLiveEvent) => void, onReconnect?: () => void): () => void;
    requestHandoff(sessionId: string): Promise<{
        success: boolean;
        humanPending: boolean;
        humanActive?: boolean;
    }>;
    notifyVisitorTyping(sessionId: string): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map