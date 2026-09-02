"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TrendingUp, Zap, ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";

const ease = [0.22, 1, 0.36, 1] as const;

const TOP_QUESTIONS = [
  { question: "What are your pricing plans?", count: 142, trend: "+12%" },
  { question: "How do I cancel my subscription?", count: 89, trend: "+8%" },
  { question: "Do you offer enterprise plans?", count: 67, trend: "+24%" },
  { question: "What's included in the free trial?", count: 54, trend: "+3%" },
  { question: "How do I contact support?", count: 41, trend: "-5%" },
];

export function LandingSignals() {
  const reduce = useReducedMotion();

  return (
    <section className="border-t border-ink/[0.08] bg-white px-4 py-16 sm:px-6 sm:py-20 md:px-12 md:py-28">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="qs-eyebrow">Business signals</p>
          <h2 className="mt-3 font-sans text-2xl font-bold leading-[1.12] tracking-[-0.02em] text-ink sm:text-3xl md:text-[2.75rem]">
            See what visitors are actually asking.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-mute sm:text-base md:text-lg">
            Every conversation becomes a signal. Spot trends, find high-intent visitors, and turn
            common questions into product improvements.
          </p>
        </FadeIn>

        <div className="mt-12 grid gap-5 sm:mt-14 lg:grid-cols-[1.2fr_0.8fr]">
          <FadeIn delay={0.1}>
            <div className="overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-soft">
              <div className="flex items-center justify-between border-b border-ink/[0.08] px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-ink" strokeWidth={1.75} />
                  <p className="text-sm font-semibold text-ink">Most asked</p>
                </div>
                <span className="font-mono text-[10px] text-mute">Last 7 days</span>
              </div>

              <div className="divide-y divide-ink/[0.06]">
                {TOP_QUESTIONS.map((q, i) => (
                  <motion.div
                    key={q.question}
                    className="flex items-center justify-between gap-3 px-5 py-3.5"
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-4% 0px" }}
                    transition={{ duration: 0.4, delay: i * 0.05, ease }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-clay font-mono text-[10px] font-semibold text-ink">
                        {i + 1}
                      </span>
                      <p className="truncate text-sm text-ink">{q.question}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-xs font-medium text-ink">{q.count}</span>
                      <span
                        className={`font-mono text-[10px] ${
                          q.trend.startsWith("+") ? "text-ink" : "text-mute"
                        }`}
                      >
                        {q.trend}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-soft">
              <div className="flex items-center justify-between border-b border-ink/[0.08] px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-ink" strokeWidth={1.75} />
                  <p className="text-sm font-semibold text-ink">Opportunity</p>
                </div>
              </div>

              <div className="p-5">
                <div className="rounded-xl border border-ink/[0.06] bg-clay p-4">
                  <p className="text-sm font-medium text-ink">
                    &ldquo;Do you offer enterprise plans?&rdquo;
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-mute">
                    67 visitors asked this week — up 24% from last week. Visitors asking this
                    question have a 3x higher conversion to human handoff.
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white">
                    <Zap className="h-3.5 w-3.5" strokeWidth={2} />
                    Create trigger
                  </button>
                  <button className="flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-xs font-medium text-ink">
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                    View conversations
                  </button>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
