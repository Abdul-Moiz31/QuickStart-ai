export type VoiceConnectionState =
  | "idle"
  | "connecting"
  | "live"
  | "speaking"
  | "reconnecting"
  | "fallback"
  | "error"
  | "ended";

export interface VoiceSessionConnectInfo {
  useEphemeralToken: boolean;
  responseModalities: string[];
  language: string;
  voiceName: string | null;
}

export interface VoiceSessionResponse {
  voiceSessionId: string;
  chatSessionId: string | null;
  provider: string;
  ephemeralToken: string;
  model: string;
  expiresAt: string;
  fallbackMode: "transcribe" | "text_only";
  connect: VoiceSessionConnectInfo;
}

export interface VoiceTranscriptEvent {
  role: "user" | "assistant";
  text: string;
  final: boolean;
}

export interface VoiceToolExecuteResult {
  output: unknown;
  actions?: {
    stopVoice?: boolean;
    humanPending?: boolean;
  };
}

export interface VoiceApiClient {
  createVoiceSession(chatSessionId?: string, resumptionHandle?: string): Promise<VoiceSessionResponse>;
  voiceHeartbeat(voiceSessionId: string, resumptionHandle?: string): Promise<void>;
  endVoiceSession(
    voiceSessionId: string,
    reason?: "user" | "error" | "timeout",
  ): Promise<void>;
  executeVoiceTool(
    voiceSessionId: string,
    call: { id: string; name: string; args: Record<string, unknown> },
  ): Promise<VoiceToolExecuteResult>;
}

export interface VoiceControllerCallbacks {
  onStateChange?: (state: VoiceConnectionState) => void;
  onTranscript?: (event: VoiceTranscriptEvent) => void;
  onError?: (message: string) => void;
  onEscalation?: () => void;
}
