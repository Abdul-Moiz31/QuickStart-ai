"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, MessageSquare } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";

const ease = [0.22, 1, 0.36, 1] as const;

const CLIENTS = [
  { name: "ChatGPT", initials: "GP" },
  { name: "Claude", initials: "CL" },
  { name: "Cursor", initials: "CR" },
];

export function LandingMcpWorkflow() {
  const reduce = useReducedMotion();

  return (
    <section className="border-t border-ink/[0.08] bg-white px-4 py-16 sm:px-6 sm:py-20 md:px-12 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
        <FadeIn className="min-w-0">
          <p className="qs-eyebrow">MCP integration</p>
          <h2 className="mt-3 font-sans text-2xl font-bold leading-[1.12] tracking-[-0.02em] text-ink sm:text-3xl md:text-4xl">
            Manage your chatbot from the tools you already use.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-mute sm:text-base md:text-lg">
            Connect your QuickStart project to ChatGPT, Claude, or Cursor with a single MCP URL.
            Update knowledge, review conversations, and check analytics — without switching tabs.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {CLIENTS.map((c) => (
              <div
                key={c.name}
                className="flex items-center gap-2.5 rounded-xl border border-ink/[0.08] bg-clay px-4 py-3"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-[10px] font-bold text-white">
                  {c.initials}
                </span>
                <span className="text-sm font-semibold text-ink">{c.name}</span>
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.1} className="min-w-0">
          <div className="overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-soft">
            <div className="flex items-center gap-2 border-b border-ink/[0.08] px-5 py-3.5">
              <MessageSquare className="h-4 w-4 text-ink" strokeWidth={1.75} />
              <p className="text-sm font-semibold text-ink">Claude</p>
              <span className="ml-auto font-mono text-[10px] text-mute">MCP connected</span>
            </div>

            <div className="space-y-3 p-5">
              <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-clay px-4 py-2.5 text-sm text-ink">
                What are visitors asking about this week?
              </div>

              <motion.div
                className="ml-auto max-w-[90%] rounded-2xl rounded-br-md border border-ink/[0.06] bg-white px-4 py-3 text-sm text-ink shadow-soft"
                initial={reduce ? false : { opacity: 0, y: 10 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-6% 0px" }}
                transition={{ duration: 0.5, delay: 0.2, ease }}
              >
                <p className="text-sm leading-relaxed">
                  This week, visitors asked about <strong>pricing plans</strong> (142 times),{" "}
                  <strong>cancellation</strong> (89), and <strong>enterprise options</strong> (67).
                  Enterprise questions are up 24% from last week.
                </p>
                <div className="mt-3 flex items-center gap-1.5 border-t border-ink/[0.06] pt-2.5 font-mono text-[10px] text-mute">
                  <Check className="h-3 w-3 text-ink" strokeWidth={2.5} />
                  via QuickStart MCP
                </div>
              </motion.div>

              <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-clay px-4 py-2.5 text-sm text-ink">
                Add an FAQ entry for enterprise pricing.
              </div>

              <motion.div
                className="ml-auto max-w-[90%] rounded-2xl rounded-br-md border border-ink/[0.06] bg-white px-4 py-3 text-sm text-ink shadow-soft"
                initial={reduce ? false : { opacity: 0, y: 10 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-6% 0px" }}
                transition={{ duration: 0.5, delay: 0.35, ease }}
              >
                <p className="text-sm leading-relaxed">
                  Done. I&apos;ve added &ldquo;Enterprise pricing starts at $99/seat/month for 50+
                  seats&rdquo; to your FAQ knowledge base. It&apos;ll be available in the next
                  visitor conversation.
                </p>
                <div className="mt-3 flex items-center gap-1.5 border-t border-ink/[0.06] pt-2.5 font-mono text-[10px] text-mute">
                  <Check className="h-3 w-3 text-ink" strokeWidth={2.5} />
                  Knowledge updated
                </div>
              </motion.div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
