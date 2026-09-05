import { useCallback, useEffect, useRef, useState } from "react";
import {
  VoiceSessionController,
  type VoiceConnectionState,
  type VoiceTranscriptEvent,
} from "@quickstart-ai/voice-core";
import type { QuickStartClient } from "@quickstart-ai/widget-core";

export interface UseRealtimeVoiceOptions {
  onTranscript?: (event: VoiceTranscriptEvent) => void;
  onFinalTranscript?: (event: VoiceTranscriptEvent) => void;
  onEscalation?: () => void;
}

export function useRealtimeVoice(client: QuickStartClient, options: UseRealtimeVoiceOptions = {}) {
  const controllerRef = useRef<VoiceSessionController | null>(null);
  const voiceSessionIdRef = useRef<string | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceConnectionState>("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      void controllerRef.current?.stop("user");
      controllerRef.current = null;
      voiceSessionIdRef.current = null;
    };
  }, []);

  const getMicLevels = useCallback((): number[] | null => {
    return controllerRef.current?.getMicLevels() ?? null;
  }, []);

  const startVoice = useCallback(
    async (chatSessionId?: string) => {
      if (controllerRef.current?.isActive) return;
      setVoiceError(null);

      const controller = new VoiceSessionController(client, {
        onStateChange: setVoiceState,
        onTranscript: (event) => {
          options.onTranscript?.(event);
          if (event.final && event.text.trim()) {
            options.onFinalTranscript?.(event);
          }
        },
        onEscalation: () => options.onEscalation?.(),
        onError: (message) => {
          if (/voice session has ended/i.test(message)) return;
          setVoiceError(message);
        },
      });
      controllerRef.current = controller;
      await controller.start(chatSessionId);
      voiceSessionIdRef.current = controller.activeVoiceSessionId;
    },
    [client, options.onTranscript, options.onFinalTranscript, options.onEscalation],
  );

  const stopVoice = useCallback(async () => {
    const controller = controllerRef.current;
    controllerRef.current = null;
    voiceSessionIdRef.current = null;
    setVoiceError(null);
    if (!controller) return;
    await controller.stop("user");
    setVoiceState("ended");
  }, []);

  const voiceActive =
    voiceState === "live" || voiceState === "speaking" || voiceState === "connecting";

  return {
    voiceState,
    voiceActive,
    voiceError,
    voiceSessionIdRef,
    getMicLevels,
    startVoice,
    stopVoice,
  };
}
