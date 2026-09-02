"use client";

import { motion, useReducedMotion } from "framer-motion";
import { HelpCircle, Plus, X, ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";

const ease = [0.22, 1, 0.36, 1] as const;

const UNANSWERED = [
  { question: "Do you integrate with Salesforce?", asked: 12, created: "3 days ago" },
  { question: "Can I white-label the widget?", asked: 8, created: "5 days ago" },
  { question: "What's your uptime SLA?", asked: 5, created: "1 week ago" },
];

export function LandingImprovement() {
  const reduce = useReducedMotion();

  return (
    <section className="border-t border-ink/[0.08] bg-white px-4 py-16 sm:px-6 sm:py-20 md:px-12 md:py-28">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="qs-eyebrow">Improvement loop</p>
          <h2 className="mt-3 font-sans text-2xl font-bold leading-[1.12] tracking-[-0.02em] text-ink sm:text-3xl md:text-[2.75rem]">
            Turn unanswered questions into better answers.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-mute sm:text-base md:text-lg">
            When your chatbot can&apos;t answer something, it shows up here. Review it, add a new
            knowledge entry, and the next visitor gets a real answer.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-12 sm:mt-14">
          <div className="overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-soft">
            <div className="flex items-center justify-between border-b border-ink/[0.08] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-ink" strokeWidth={1.75} />
                <p className="text-sm font-semibold text-ink">Needs attention</p>
              </div>
              <span className="rounded-full bg-clay px-2.5 py-0.5 text-[10px] font-semibold text-ink">
                3 unanswered
              </span>
            </div>

            <div className="divide-y divide-ink/[0.06]">
              {UNANSWERED.map((q, i) => (
                <motion.div
                  key={q.question}
                  className="px-5 py-4"
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-4% 0px" }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink">{q.question}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-mute">
                        <span>Asked {q.asked} times</span>
                        <span className="h-0.5 w-0.5 rounded-full bg-mute" />
                        <span>First seen {q.created}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white">
                        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                        Add answer
                      </button>
                      <button className="flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-xs font-medium text-mute">
                        <X className="h-3 w-3" strokeWidth={2} />
                        Dismiss
                      </button>
                    </div>
                  </div>

                  {i === 0 && (
                    <motion.div
                      className="mt-4 rounded-xl border border-ink/[0.06] bg-porcelain p-4"
                      initial={reduce ? false : { opacity: 0, height: 0 }}
                      whileInView={reduce ? undefined : { opacity: 1, height: "auto" }}
                      viewport={{ once: true, margin: "-4% 0px" }}
                      transition={{ duration: 0.5, delay: 0.3, ease }}
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
                        Suggested knowledge entry
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-ink">
                        QuickStart AI does not currently integrate directly with Salesforce. However,
                        you can use our webhook triggers to push conversation events to Salesforce
                        via Zapier or a custom integration.
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <button className="flex items-center gap-1 text-xs font-semibold text-ink">
                          <ArrowRight className="h-3 w-3" strokeWidth={2} />
                          Add to knowledge base
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
