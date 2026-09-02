"use client";

import { MessageCircle } from "lucide-react";

export type PreviewTheme = "primary" | "secondary" | "tech" | "professional";
export type ColorSource = "theme" | "custom";

export const THEME_COLORS: Record<PreviewTheme, { bg: string; accent: string; text: string }> = {
  primary: { bg: "#0B6E4F", accent: "#08A045", text: "#ffffff" },
  secondary: { bg: "#1C2541", accent: "#3A506B", text: "#ffffff" },
  tech: { bg: "#0F172A", accent: "#38BDF8", text: "#ffffff" },
  professional: { bg: "#1B3A4B", accent: "#C9A227", text: "#ffffff" },
};

function contrastText(bg: string) {
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

export function resolveWidgetColors(
  colorSource: ColorSource,
  theme: PreviewTheme,
  primaryColor: string,
) {
  if (colorSource === "custom") {
    const bg = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(primaryColor.trim())
      ? primaryColor.trim()
      : "#0A0A0A";
    return { bg, accent: bg, text: contrastText(bg), label: "custom" };
  }
  const palette = THEME_COLORS[theme];
  return { ...palette, label: theme };
}

export function ChatbotAppearancePreview({
  colorSource,
  theme,
  position,
  primaryColor,
  welcomeMessage,
  projectName = "QuickStart AI",
}: {
  colorSource: ColorSource;
  theme: PreviewTheme;
  position: "left" | "right";
  primaryColor: string;
  welcomeMessage: string;
  projectName?: string;
}) {
  const colors = resolveWidgetColors(colorSource, theme, primaryColor);
  const headerBg = colors.bg;
  const headerText = colors.text;
  const isLeft = position === "left";

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-ink/[0.06] px-4 py-3">
        <div>
          <p className="qs-micro-label">Live preview</p>
          <p className="mt-0.5 text-sm font-medium text-ink">How visitors will see it</p>
        </div>
        <span className="rounded-md bg-clay px-2 py-0.5 font-mono text-[10px] uppercase text-mute">
          {position}
        </span>
      </div>

      <div className="relative h-[520px] bg-clay/50 p-4 sm:p-5">
        <div className="pointer-events-none absolute inset-x-8 top-8 max-w-[200px] space-y-2 opacity-40">
          <div className="h-2 w-24 rounded-full bg-ink/10" />
          <div className="h-2 w-40 rounded-full bg-ink/10" />
          <div className="h-2 w-32 rounded-full bg-ink/10" />
        </div>

        <div
          className={`absolute bottom-[76px] flex h-[400px] w-[min(100%-1.5rem,320px)] flex-col overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-[0_16px_40px_rgba(10,10,10,0.14)] ${
            isLeft ? "left-4 sm:left-5" : "right-4 sm:right-5"
          }`}
        >
          <div className="flex shrink-0 items-center gap-2.5 border-b border-ink/[0.06] bg-white px-3.5 py-3">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold"
              style={{ background: headerBg, color: headerText }}
            >
              QS
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-ink">{projectName}</p>
              <p className="text-[10px] text-mute">Online</p>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto bg-clay px-3.5 py-3">
            <div
              className="max-w-[92%] rounded-2xl rounded-tl-sm px-3 py-2 text-[12px] leading-snug text-ink"
              style={{ background: "#F7F5F1" }}
            >
              {welcomeMessage.trim() || "Hi — how can I help?"}
            </div>
            <div
              className="ml-auto max-w-[88%] rounded-full px-3.5 py-2 text-[12px] leading-snug"
              style={{ background: headerBg, color: headerText }}
            >
              What are your support hours?
            </div>
            <div
              className="max-w-[92%] rounded-2xl rounded-tl-sm px-3 py-2 text-[12px] leading-snug text-ink"
              style={{ background: "#F7F5F1" }}
            >
              Mon–Fri, 9am–6pm. Happy to help.
            </div>
          </div>

          <div className="flex shrink-0 gap-2 border-t border-ink/[0.06] bg-white p-3">
            <div className="flex-1 rounded-full border border-ink/15 bg-white px-3.5 py-2 text-[11px] text-mute">
              Type a message…
            </div>
            <button
              type="button"
              tabIndex={-1}
              className="rounded-xl px-3 py-2 text-[11px] font-semibold"
              style={{ background: headerBg, color: headerText }}
            >
              Send
            </button>
          </div>
        </div>

        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          className={`absolute bottom-4 flex h-14 w-14 items-center justify-center rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.2)] ${
            isLeft ? "left-4 sm:left-5" : "right-4 sm:right-5"
          }`}
          style={{ background: headerBg, color: headerText }}
        >
          <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
        </button>

        <div
          className={`absolute top-4 rounded-full px-2.5 py-1 text-[10px] font-medium ${
            isLeft ? "right-4" : "left-4"
          }`}
          style={{ background: colors.accent, color: contrastText(colors.accent) }}
        >
          {colorSource === "custom" ? "custom" : theme}
        </div>
      </div>
    </div>
  );
}
