"use client";

import { useState } from "react";

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-ink/[0.08] bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-mute">{label}</p>
      <p className="mt-2 font-sans text-2xl font-bold tabular-nums text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-mute">{hint}</p>}
    </div>
  );
}

function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

export function VolumeBars({ data }: { data: { date: string; count: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.count));
  const active = hover === null ? null : data[hover];

  return (
    <div>
      <div className="flex h-6 items-center">
        {active ? (
          <p className="text-xs text-ink">
            <span className="font-semibold tabular-nums">{active.count}</span>{" "}
            {active.count === 1 ? "message" : "messages"} on {shortDate(active.date)}
          </p>
        ) : (
          <p className="text-xs text-mute">Hover a bar for the daily count</p>
        )}
      </div>

      <div
        className="mt-2 flex h-32 items-end gap-[2px]"
        onMouseLeave={() => setHover(null)}
      >
        {data.map((d, i) => (
          <button
            key={d.date}
            type="button"
            aria-label={`${d.count} messages on ${shortDate(d.date)}`}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            className="group relative flex h-full flex-1 items-end outline-none"
          >
            <span
              className={`w-full rounded-t-[3px] transition-colors ${
                hover === i ? "bg-ink" : "bg-ink/70"
              } ${d.count === 0 ? "bg-ink/[0.07]" : ""}`}
              style={{ height: d.count === 0 ? "2px" : `${(d.count / max) * 100}%` }}
            />
          </button>
        ))}
      </div>

      <div className="mt-2 flex justify-between text-xs text-mute">
        <span>{data.length > 0 ? shortDate(data[0]!.date) : ""}</span>
        <span>{data.length > 0 ? shortDate(data[data.length - 1]!.date) : ""}</span>
      </div>
    </div>
  );
}

const QUALITY_SEGMENTS = [
  { key: "strong", label: "Answered well", fill: "bg-ink" },
  { key: "weak", label: "Weak answer", fill: "bg-ink/45" },
  { key: "unscored", label: "Not scored", fill: "bg-ink/15" },
] as const;

export function QualityBar({
  breakdown,
}: {
  breakdown: { strong: number; weak: number; unscored: number };
}) {
  const total = breakdown.strong + breakdown.weak + breakdown.unscored;

  return (
    <div>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full">
        {QUALITY_SEGMENTS.map((seg) => {
          const value = breakdown[seg.key];
          if (total === 0 || value === 0) return null;
          return (
            <div
              key={seg.key}
              className={`h-full ${seg.fill}`}
              style={{ width: `${(value / total) * 100}%` }}
            />
          );
        })}
        {total === 0 && <div className="h-full w-full bg-ink/[0.07]" />}
      </div>

      <ul className="mt-4 space-y-2">
        {QUALITY_SEGMENTS.map((seg) => (
          <li key={seg.key} className="flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${seg.fill}`} aria-hidden />
            <span className="text-mute">{seg.label}</span>
            <span className="ml-auto font-medium tabular-nums text-ink">
              {breakdown[seg.key]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ToolBars({ data }: { data: { tool: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.tool}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate font-mono text-xs text-ink">{d.tool}</span>
            <span className="shrink-0 text-xs font-medium tabular-nums text-mute">{d.count}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-clay">
            <div
              className="h-full rounded-full bg-ink"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
