"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Link2, Plug, ShieldCheck } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";
import { MCP_BRANDS } from "@/components/landing/McpBrandIcons";

const ease = [0.22, 1, 0.36, 1] as const;

const STEPS = [
  {
    title: "Paste your MCP URL",
    body: "Copy the hosted MCP endpoint from your QuickStart dashboard.",
  },
  {
    title: "Sign in with OAuth",
    body: "Approve access once — ChatGPT connects securely, no API keys in chat.",
  },
  {
    title: "Manage from your AI",
    body: "Update FAQs, business profile, and search conversations as MCP tools.",
  },
] as const;

const MCP_TOOLS = [
  "get_business_profile",
  "list_faqs",
  "list_conversations",
  "search_conversations",
] as const;

function McpConnectMock() {
  const reduce = useReducedMotion();

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.85)_0%,transparent_68%)] md:-inset-8"
      />

      <motion.div
        className="relative overflow-hidden rounded-[1.35rem] border border-ink/[0.08] bg-white shadow-[0_24px_60px_rgba(10,10,10,0.08)]"
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8% 0px" }}
        transition={{ duration: 0.75, ease }}
      >
        <div className="flex items-center gap-2 border-b border-ink/[0.06] px-4 py-3 sm:px-5">
          <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
          <div className="ml-2 flex flex-1 items-center gap-2 rounded-lg border border-ink/[0.08] bg-clay/50 px-3 py-1.5">
            <Plug className="h-3.5 w-3.5 text-ink/70" strokeWidth={2} aria-hidden />
            <p className="truncate font-mono text-[11px] text-ink/80 sm:text-xs">
              ChatGPT · MCP Connectors
            </p>
          </div>
        </div>

        <div className="space-y-5 bg-clay/35 p-5 sm:p-6 md:p-7">
          <div>
            <p className="font-sans text-sm font-bold text-ink">Add MCP server</p>
            <p className="mt-1 text-xs text-mute">Model Context Protocol endpoint</p>
            <div className="mt-3 rounded-xl border border-ink/[0.1] bg-white px-3.5 py-3">
              <p className="font-mono text-[11px] text-mute sm:text-xs">Server URL</p>
              <p className="mt-1 break-all font-mono text-xs text-ink sm:text-sm">
                https://api.quickstart.ai/mcp
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-ink/[0.08] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-xs font-bold text-white">
                  QS
                </span>
                <div className="min-w-0">
                  <p className="truncate font-sans text-sm font-bold text-ink">QuickStart AI</p>
                  <p className="text-xs text-mute">MCP · OAuth connected</p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-ink/[0.08] bg-clay px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-ink">
                <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                Live
              </span>
            </div>

            <div className="mt-4 border-t border-ink/[0.06] pt-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
                MCP tools
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {MCP_TOOLS.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-md border border-ink/[0.08] bg-clay/70 px-2 py-1 font-mono text-[10px] text-ink/80"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-ink/[0.08] bg-white/80 px-3.5 py-3 text-xs text-mute">
            <ShieldCheck className="h-4 w-4 shrink-0 text-ink" strokeWidth={1.75} aria-hidden />
            OAuth keeps your account secure — tools run on your project only.
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function LandingMcpSection() {
  return (
    <section className="border-t border-ink/[0.08] bg-clay px-4 py-12 sm:px-6 sm:py-16 md:px-12 md:py-20">
      <div className="mx-auto max-w-6xl min-w-0">
        <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="min-w-0">
            <FadeIn>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-mute">
                MCP Server
              </p>
              <h2 className="mt-3 font-sans text-2xl font-bold tracking-tight text-black sm:text-3xl md:text-4xl">
                Connect your chatbot to your favorite AI with MCP
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-mute sm:text-base md:text-lg">
                QuickStart hosts a{" "}
                <span className="font-medium text-ink">Model Context Protocol (MCP)</span> server
                so you can manage FAQs, business details, and visitor conversations from ChatGPT,
                Cursor, Claude, and other MCP clients.
              </p>
            </FadeIn>

            <FadeIn delay={0.08} className="mt-8 space-y-0">
              {STEPS.map((step, index) => (
                <div
                  key={step.title}
                  className="relative flex gap-4 border-t border-ink/[0.08] py-5 first:border-t-0 first:pt-0"
                >
                  {index < STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute left-[15px] top-[2.75rem] h-[calc(100%-0.5rem)] w-px bg-ink/10"
                    />
                  )}
                  <span className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black bg-black font-mono text-[11px] font-semibold text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="font-sans text-base font-bold text-ink">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-mute">{step.body}</p>
                  </div>
                </div>
              ))}
            </FadeIn>

            <FadeIn delay={0.12} className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/docs/mcp"
                className="qs-btn-primary w-full justify-center !px-6 !py-2.5 text-sm sm:w-auto"
              >
                Connect with MCP
              </Link>
              <Link
                href="/login"
                className="qs-btn-ghost w-full justify-center !px-6 !py-2.5 text-sm sm:w-auto"
              >
                Sign in
              </Link>
            </FadeIn>
          </div>

          <div className="min-w-0">
            <McpConnectMock />
          </div>
        </div>

        <FadeIn delay={0.1} className="mt-10 border-t border-ink/[0.08] pt-8 sm:mt-14 sm:pt-10">
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-mute">
            Works with MCP clients
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {MCP_BRANDS.map(({ name, Icon, tint, href }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-ink/[0.08] bg-white px-4 py-3.5 shadow-soft transition hover:border-ink/20 hover:bg-clay/40 hover:shadow-[0_8px_24px_rgba(10,10,10,0.06)]"
                aria-label={`Visit ${name}`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border border-ink/[0.08] bg-clay ${tint}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-sans text-sm font-bold text-ink">{name}</p>
                  <p className="flex items-center gap-1 text-xs text-mute">
                    <Link2 className="h-3 w-3" strokeWidth={2} aria-hidden />
                    MCP connector
                  </p>
                </div>
              </a>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
