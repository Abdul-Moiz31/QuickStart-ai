"use client";

import { Loader2 } from "lucide-react";
import { SimpleProgressBar } from "@/components/dashboard/eval/EvalCharts";

export function EvalLoadingOverlay({
  message,
  current,
  total,
}: {
  message: string;
  current: number;
  total: number;
}) {
  const pct = total > 0 ? current / total : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 px-6 backdrop-blur-[2px]">
      <div className="w-full max-w-sm rounded-2xl border border-ink/[0.08] bg-white p-8 shadow-soft text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-ink" strokeWidth={1.75} />
        <p className="mt-5 font-sans text-lg font-bold text-ink">Running evaluation</p>
        <p className="mt-2 text-sm text-mute">{message}</p>
        {total > 0 && (
          <div className="mt-6 text-left">
            <div className="mb-2 flex justify-between text-xs text-mute">
              <span>Progress</span>
              <span className="tabular-nums">
                {current} / {total}
              </span>
            </div>
            <SimpleProgressBar value={pct} />
          </div>
        )}
        <p className="mt-4 text-xs text-mute">
          Testing your FAQ through the chatbot. This can take a few minutes — free models may
          pause briefly on rate limits.
        </p>
      </div>
    </div>
  );
}
