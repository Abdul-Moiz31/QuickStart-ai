"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, Code2 } from "lucide-react";

const WORDMARK_BASE_PX = 100;
const WORDMARK_SIDE_MARGIN = 0.96;
const WORDMARK_MIN_PX = 28;
const WORDMARK_MAX_PX = 260;

function FitWordmark({ text }: { text: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState<number | null>(null);

  useLayoutEffect(() => {
    function measure() {
      const container = containerRef.current;
      const el = textRef.current;
      if (!container || !el) return;
      const containerWidth = container.getBoundingClientRect().width;

      const previousFontSize = el.style.fontSize;
      el.style.fontSize = `${WORDMARK_BASE_PX}px`;
      const naturalWidth = el.getBoundingClientRect().width;
      el.style.fontSize = previousFontSize;

      if (naturalWidth === 0 || containerWidth === 0) return;
      const scale = (containerWidth * WORDMARK_SIDE_MARGIN) / naturalWidth;
      const next = Math.max(WORDMARK_MIN_PX, Math.min(WORDMARK_BASE_PX * scale, WORDMARK_MAX_PX));
      setFontSize(next);
    }

    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full overflow-hidden text-center">
      <span
        ref={textRef}
        className="inline-block whitespace-nowrap font-display font-black leading-none tracking-tight text-ink/[0.12]"
        style={{
          fontSize: `${fontSize ?? WORDMARK_BASE_PX}px`,
          visibility: fontSize ? "visible" : "hidden",
        }}
      >
        {text}
      </span>
    </div>
  );
}

function DotBracket({ side }: { side: "left" | "right" }) {
  return (
    <div
      aria-hidden
      className={`hidden h-24 w-24 shrink-0 border-ink/15 sm:block md:h-28 md:w-28 ${
        side === "left" ? "rounded-l-2xl border-y border-l" : "rounded-r-2xl border-y border-r"
      }`}
      style={{
        backgroundImage: "radial-gradient(circle, rgba(30,33,58,0.16) 1px, transparent 1px)",
        backgroundSize: "10px 10px",
      }}
    />
  );
}

export function LandingFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-ink/[0.08] bg-gradient-to-b from-porcelain to-clay px-4 pt-14 sm:px-6 md:px-12">
      <div className="relative z-10 mx-auto max-w-6xl min-w-0">
        <div className="grid gap-10 md:grid-cols-3 md:items-center">
          <div className="order-2 min-w-0 md:order-1">
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/Abdul-Moiz31/QuickStart-ai"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-ink transition hover:bg-white"
              >
                <Code2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              </a>
              <Link
                href="/docs/embed"
                aria-label="Documentation"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-ink transition hover:bg-white"
              >
                <BookOpen className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              </Link>
            </div>
            <a
              href="mailto:hello@quickstart.ai"
              className="mt-6 block font-display text-lg font-semibold text-ink hover:underline"
            >
              hello@quickstart.ai
            </a>
          </div>

          <div className="order-1 flex items-center justify-center md:order-2">
            <DotBracket side="left" />
            <Link
              href="/register"
              className="relative z-10 flex items-center gap-2 whitespace-nowrap rounded-2xl bg-btn-primary px-5 py-3 text-sm font-semibold text-white shadow-btn transition hover:brightness-110"
            >
              Get started
              <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                Free
              </span>
            </Link>
            <DotBracket side="right" />
          </div>

          <nav className="order-3 flex flex-col items-start gap-2.5 text-sm font-semibold text-ink md:items-end">
            <a href="#how" className="transition hover:text-accent">
              How it works
            </a>
            <a href="#install" className="transition hover:text-accent">
              Install
            </a>
            <Link href="/docs/embed" className="transition hover:text-accent">
              Documentation
            </Link>
            <Link href="/docs/mcp" className="transition hover:text-accent">
              MCP
            </Link>
            <Link href="/login" className="transition hover:text-accent">
              Sign in
            </Link>
          </nav>
        </div>

        <div className="mt-14 flex items-center justify-center border-t border-ink/[0.08] py-6 text-xs text-mute">
          © {new Date().getFullYear()} QuickStart AI. All rights reserved.
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none relative -mb-4 px-4 sm:-mb-6 md:-mb-10"
      >
        <FitWordmark text="QuickStart AI" />
      </div>
    </footer>
  );
}
