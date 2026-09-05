import React from "react";
import type { VoiceConnectionState } from "@quickstart-ai/voice-core";
import {
  VoiceEndCallIcon,
  VoiceWaveformIcon,
  VoiceWaveformStatus,
  VoiceWaveformStrip,
  useMicLevels,
} from "./VoiceWaveform.js";

export type VoiceChatBarVariant = "inline" | "icon" | "dock";

export interface VoiceChatBarProps {
  variant: VoiceChatBarVariant;
  active: boolean;
  state: VoiceConnectionState;
  disabled?: boolean;
  accentBg: string;
  accentText: string;
  onStart: () => void;
  onStop: () => void;
  getMicLevels?: (() => number[] | null) | null;
}

export function VoiceChatBar({
  variant,
  active,
  state,
  disabled,
  accentBg,
  accentText,
  onStart,
  onStop,
  getMicLevels = null,
}: VoiceChatBarProps) {
  const micLevels = useMicLevels(getMicLevels, active && state === "live");

  if (active && variant !== "dock") return null;
  if (!active && variant === "dock") return null;

  if (!active && variant === "icon") {
    return (
      <button
        type="button"
        className="qs-voice-icon-btn"
        onClick={onStart}
        disabled={disabled}
        title="Start voice chat"
        aria-label="Start voice chat"
        style={{
          color: accentText,
          background: accentBg,
          borderColor: accentBg,
        }}
      >
        <VoiceWaveformIcon size={18} />
      </button>
    );
  }

  if (!active) {
    return (
      <div className={`qs-voice-bar-wrap${variant === "inline" ? " qs-voice-bar-wrap--inline" : ""}`}>
        <button
          type="button"
          className="qs-voice-start-btn"
          onClick={onStart}
          disabled={disabled}
          aria-label="Start voice chat"
        >
          <span className="qs-voice-start-btn__icon" style={{ color: accentText, background: accentBg }}>
            <VoiceWaveformIcon size={15} />
          </span>
          <span className="qs-voice-start-btn__text">Start voice chat</span>
        </button>
      </div>
    );
  }

  return (
    <div className="qs-voice-bar-wrap qs-voice-bar-wrap--dock">
      <div className="qs-voice-active-dock" role="status" aria-live="polite">
        <VoiceWaveformStrip
          state={state}
          levels={state === "live" ? micLevels : null}
          className="qs-voice-active-dock__strip"
        />
        <VoiceWaveformStatus state={state} />
        <button
          type="button"
          className="qs-voice-stop-btn"
          onClick={onStop}
          aria-label="End voice chat"
          title="End voice chat"
        >
          <VoiceEndCallIcon size={17} />
        </button>
      </div>
    </div>
  );
}
