import React, { useEffect, useMemo, useRef, useState } from "react";
import type { VoiceConnectionState } from "@quickstart-ai/voice-core";

const BAR_COUNT = 48;
const SMOOTHING = 0.58;

export function VoiceWaveformIcon({ size = 16 }: { size?: number }) {
  const barW = size * 0.13;
  const gap = size * 0.09;
  const heights = [0.4, 0.72, 0.95, 0.58];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {heights.map((h, i) => {
        const barH = size * h * 0.52;
        const x = (size - (barW * 4 + gap * 3)) / 2 + i * (barW + gap);
        const y = (size - barH) / 2;
        return (
          <rect key={i} x={x} y={y} width={barW} height={barH} rx={barW / 2} fill="currentColor" />
        );
      })}
    </svg>
  );
}

/** End-call icon — matches widget icon stroke weight. */
export function VoiceEndCallIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
      <line x1="22" y1="2" x2="2" y2="22" />
    </svg>
  );
}

function centerEnvelope(index: number, total: number): number {
  const center = (total - 1) / 2;
  const dist = Math.abs(index - center) / center;
  return Math.max(0.06, 1 - dist ** 1.65);
}

function isEdgeDot(index: number, total: number): boolean {
  const center = (total - 1) / 2;
  return Math.abs(index - center) / center > 0.68;
}

function barMotionVars(index: number): React.CSSProperties {
  const env = centerEnvelope(index, BAR_COUNT);
  const min = 0.1 + 0.08 * env;
  const max = 0.35 + 0.65 * env;
  const dur = 0.95 + (index % 9) * 0.09 + env * 0.25;
  return {
    ["--bar-env" as string]: String(env),
    ["--bar-min" as string]: String(min),
    ["--bar-max" as string]: String(max),
    ["--bar-dur" as string]: `${dur}s`,
    animationDelay: `${((index * 0.031) + env * 0.12) % 1.2}s`,
  };
}

function smoothLevels(prev: number[] | null, next: number[]): number[] {
  if (!prev || prev.length !== next.length) return next;
  return next.map((v, i) => prev[i]! * SMOOTHING + v * (1 - SMOOTHING));
}

export interface VoiceWaveformStripProps {
  state: VoiceConnectionState;
  levels?: number[] | null;
  className?: string;
}

export function VoiceWaveformStrip({ state, levels, className = "" }: VoiceWaveformStripProps) {
  const speaking = state === "speaking";
  const active = state === "live" || state === "speaking" || state === "connecting";
  const usingMic = levels != null && state === "live";
  const bars = useMemo(() => Array.from({ length: BAR_COUNT }, (_, i) => i), []);

  return (
    <div
      className={`qs-voice-wave-strip${speaking ? " qs-voice-wave-strip--speaking" : ""}${active ? " qs-voice-wave-strip--active" : ""}${usingMic ? " qs-voice-wave-strip--mic" : ""} ${className}`.trim()}
      aria-hidden="true"
    >
      {bars.map((i) => {
        const dot = isEdgeDot(i, BAR_COUNT);
        const env = centerEnvelope(i, BAR_COUNT);
        const motion = barMotionVars(i);
        const raw = levels?.[i] ?? levels?.[Math.floor((i / BAR_COUNT) * (levels?.length ?? 1))] ?? 0;
        const micScale = usingMic
          ? Math.max(0.12, Math.min(1, 0.14 + raw * env * 1.15))
          : undefined;

        return (
          <span
            key={i}
            className={`qs-voice-wave-strip__bar${dot ? " qs-voice-wave-strip__bar--dot" : ""}`}
            style={{
              ...motion,
              ...(micScale !== undefined
                ? {
                    transform: dot ? undefined : `scaleY(${micScale})`,
                    opacity: dot ? 0.25 + raw * 0.55 * env : 0.3 + raw * 0.65 * env,
                  }
                : undefined),
            }}
          />
        );
      })}
    </div>
  );
}

export function useMicLevels(getLevels: (() => number[] | null) | null, active: boolean) {
  const [levels, setLevels] = useState<number[] | null>(null);
  const smoothedRef = useRef<number[] | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active || !getLevels) {
      smoothedRef.current = null;
      setLevels(null);
      return;
    }

    const tick = () => {
      const raw = getLevels();
      if (raw?.length) {
        smoothedRef.current = smoothLevels(smoothedRef.current, raw);
        setLevels([...smoothedRef.current!]);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [active, getLevels]);

  return levels;
}

function statusLabel(state: VoiceConnectionState): string {
  if (state === "connecting" || state === "reconnecting") return "Connecting…";
  if (state === "speaking") return "Speaking";
  if (state === "live") return "Listening";
  if (state === "error") return "Voice error";
  return "Voice chat";
}

export function VoiceWaveformStatus({ state }: { state: VoiceConnectionState }) {
  return <span className="qs-voice-wave-status">{statusLabel(state)}</span>;
}
