"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";
import { MCP_BRANDS } from "@/components/landing/McpBrandIcons";

export function LandingMcpSection() {
  return (
    <section className="border-t border-ink/[0.08] bg-clay px-4 py-16 sm:px-6 sm:py-20 md:px-12 md:py-24">
      <div className="mx-auto max-w-3xl min-w-0 text-center">
        <FadeIn>
          <p className="qs-eyebrow">MCP Server</p>
          <h2 className="mt-4 qs-section-title">Manage your chatbot from your AI tools.</h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-mute sm:text-base md:text-lg">
            Connect QuickStart AI to ChatGPT, Cursor, or Claude and update your chatbot right where
            you already work.
          </p>
        </FadeIn>

        <FadeIn delay={0.08} className="mx-auto mt-10 max-w-md sm:mt-12">
          <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 text-left shadow-soft">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-xs font-bold text-white">
                QS
              </span>
              <p className="min-w-0 flex-1 text-sm font-bold text-ink">QuickStart AI</p>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-clay px-2.5 py-1 text-[10px] font-semibold text-ink">
                <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                Connected
              </span>
            </div>
            <p className="mt-4 break-all rounded-xl bg-clay/70 px-3.5 py-3 font-mono text-xs text-ink">
              https://api.quickstart.ai/mcp
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.12} className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {MCP_BRANDS.map(({ name, Icon, tint, href }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-ink/[0.08] bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink/20"
            >
              <Icon className={`h-4 w-4 ${tint}`} />
              {name}
            </a>
          ))}
        </FadeIn>

        <FadeIn delay={0.16} className="mt-9 flex justify-center">
          <Link href="/docs/mcp" className="qs-btn-primary w-full justify-center sm:w-auto">
            Connect with MCP
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
