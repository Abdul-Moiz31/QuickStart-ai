"use client";

import { motion, useReducedMotion } from "framer-motion";
import { pct } from "@quickstart-ai/shared";

const RING = 54;
const STROKE = 6;

/** Single ink ring — used for overall readiness on Eval. */
export function RingProgress({
  value,
  size = 160,
}: {
  value: number;
  size?: number;
}) {
  const reduce = useReducedMotion();
  const c = 2 * Math.PI * RING;
  const clamped = Math.max(0, Math.min(1, value));
  const offset = c * (1 - clamped);

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        className="-rotate-90"
        aria-hidden
      >
        <circle cx="60" cy="60" r={RING} fill="none" stroke="rgba(10,10,10,0.08)" strokeWidth={STROKE} />
        <motion.circle
          cx="60"
          cy="60"
          r={RING}
          fill="none"
          stroke="#0A0A0A"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={reduce ? { strokeDashoffset: offset } : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: reduce ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-sans text-3xl font-bold tabular-nums text-ink">{pct(clamped)}</span>
        <span className="mt-0.5 text-xs text-mute">ready</span>
      </div>
    </div>
  );
}

export function SimpleProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-clay">
      <div className="h-full rounded-full bg-ink transition-all duration-700" style={{ width: `${v * 100}%` }} />
    </div>
  );
}
