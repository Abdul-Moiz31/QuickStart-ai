"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FileText, Globe, RefreshCw, Plus, BookOpen } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";

const ease = [0.22, 1, 0.36, 1] as const;

const SOURCES = [
  { icon: Globe, label: "Website", count: "24 pages", status: "Indexed", time: "2 min ago" },
  { icon: FileText, label: "FAQs", count: "48 entries", status: "Indexed", time: "12 min ago" },
  { icon: BookOpen, label: "Documentation", count: "126 pages", status: "Syncing", time: "Now" },
  { icon: FileText, label: "Policies", count: "12 documents", status: "Indexed", time: "1 hr ago" },
];

const OPENED_ENTRIES = ["Pricing", "Refund policy", "Shipping", "Support hours"];

export function LandingKnowledge() {
  const reduce = useReducedMotion();

  return (
    <section className="border-t border-ink/[0.08] bg-white px-4 py-16 sm:px-6 sm:py-20 md:px-12 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
        <FadeIn className="min-w-0">
          <p className="qs-eyebrow">Your knowledge</p>
          <h2 className="mt-3 font-sans text-2xl font-bold leading-[1.12] tracking-[-0.02em] text-ink sm:text-3xl md:text-4xl">
            Start with what your business already knows.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-mute sm:text-base md:text-lg">
            Bring together your website, FAQs, policies, documentation, and internal answers.
            QuickStart uses that information as the source for every visitor conversation.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="min-w-0">
          <div className="overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-soft">
            <div className="flex items-center justify-between border-b border-ink/[0.08] px-5 py-3.5">
              <p className="text-sm font-semibold text-ink">Knowledge sources</p>
              <div className="flex items-center gap-2">
                <button className="flex h-8 items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-clay px-3 text-xs font-medium text-ink">
                  <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Sync all
                </button>
                <button className="flex h-8 items-center gap-1.5 rounded-lg bg-ink px-3 text-xs font-medium text-white">
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                  Add source
                </button>
              </div>
            </div>

            <div className="divide-y divide-ink/[0.06]">
              {SOURCES.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.label}
                    className="flex items-center justify-between gap-3 px-5 py-3.5"
                    initial={reduce ? false : { opacity: 0, x: -10 }}
                    whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-6% 0px" }}
                    transition={{ duration: 0.4, delay: i * 0.06, ease }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink/[0.08] bg-clay">
                        <Icon className="h-4 w-4 text-ink" strokeWidth={1.75} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">{s.label}</p>
                        <p className="text-xs text-mute">{s.count}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          s.status === "Syncing"
                            ? "bg-ink/[0.06] text-mute"
                            : "bg-ink/[0.04] text-ink"
                        }`}
                      >
                        {s.status}
                      </span>
                      <span className="font-mono text-[10px] text-mute">{s.time}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="border-t border-ink/[0.08] bg-clay/50 px-5 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
                FAQs &middot; opened
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {OPENED_ENTRIES.map((entry) => (
                  <div
                    key={entry}
                    className="rounded-lg border border-ink/[0.06] bg-white px-3 py-2 text-xs font-medium text-ink"
                  >
                    {entry}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
