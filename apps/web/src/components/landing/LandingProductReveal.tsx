"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MessageSquareText, Sparkles } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";

const ease = [0.22, 1, 0.36, 1] as const;

const SUGGESTED = [
  "What's included in the free trial?",
  "Do you offer annual pricing?",
  "How do I contact support?",
];

export function LandingProductReveal() {
  const reduce = useReducedMotion();

  return (
    <section className="border-t border-ink/[0.08] bg-white px-4 py-16 sm:px-6 sm:py-20 md:px-12 md:py-28">
      <FadeIn className="mx-auto max-w-4xl text-center">
        <p className="qs-eyebrow">The product</p>
        <h2 className="mt-3 font-sans text-2xl font-bold leading-[1.12] tracking-[-0.02em] text-ink sm:text-3xl md:text-[2.75rem]">
          A chatbot that actually works for your visitors.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-mute sm:text-base md:text-lg">
          QuickStart lives on your website, surfaces real answers from your own content, and gives
          your team visibility into what visitors need.
        </p>
      </FadeIn>

      <FadeIn delay={0.12} className="mx-auto mt-12 max-w-5xl sm:mt-14">
        <div className="overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-[0_24px_70px_rgba(10,10,10,0.1)] sm:rounded-3xl">
          <div className="flex items-center gap-2 border-b border-ink/[0.06] px-3 py-2.5 sm:px-5 sm:py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
            <div className="ml-2 flex-1 rounded-lg border border-ink/[0.08] bg-clay/50 px-3 py-1.5">
              <p className="font-mono text-[10px] text-ink/70 sm:text-xs">yoursite.com/pricing</p>
            </div>
          </div>

          <div className="flex flex-col bg-clay/30 md:relative md:min-h-[480px]">
            <div className="px-6 pt-8 sm:px-10 sm:pt-12">
              <div className="max-w-md">
                <div className="h-6 w-40 rounded bg-ink/[0.08]" />
                <div className="mt-5 space-y-2.5">
                  <div className="h-2.5 w-full rounded bg-ink/[0.05]" />
                  <div className="h-2.5 w-[85%] rounded bg-ink/[0.05]" />
                  <div className="h-2.5 w-[70%] rounded bg-ink/[0.05]" />
                </div>
                <div className="mt-8 grid grid-cols-3 gap-3">
                  {["Starter", "Pro", "Enterprise"].map((p) => (
                    <div
                      key={p}
                      className="rounded-xl border border-ink/[0.06] bg-white px-3 py-4 text-center"
                    >
                      <p className="text-xs font-semibold text-ink">{p}</p>
                      <div className="mx-auto mt-2 h-2 w-12 rounded bg-ink/[0.06]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <motion.div
              className="mx-4 mb-6 mt-6 flex max-w-[340px] flex-col overflow-hidden rounded-2xl border border-ink/[0.1] bg-white shadow-[0_20px_50px_rgba(10,10,10,0.12)] sm:mx-6 md:absolute md:bottom-6 md:right-6 md:mx-0 md:mt-0"
              initial={reduce ? false : { opacity: 0, y: 24, scale: 0.96 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ duration: 0.75, delay: 0.15, ease }}
            >
              <div className="flex items-center gap-2.5 border-b border-ink/[0.06] px-4 py-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-white">
                  QS
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-ink">QuickStart AI</p>
                  <p className="text-[10px] text-mute">Online</p>
                </div>
              </div>

              <div className="flex-1 space-y-2.5 px-4 py-4">
                <div className="rounded-2xl rounded-tl-md bg-clay px-3 py-2 text-[12px] leading-snug text-ink">
                  Hi! Ask me anything about this site.
                </div>

                <div className="space-y-1.5">
                  <p className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-mute">
                    <Sparkles className="h-3 w-3" strokeWidth={1.5} />
                    Suggested
                  </p>
                  {SUGGESTED.map((q, i) => (
                    <motion.div
                      key={q}
                      className="rounded-xl border border-ink/[0.08] bg-white px-3 py-2 text-[11px] text-ink transition hover:bg-clay/50"
                      initial={reduce ? false : { opacity: 0, y: 6 }}
                      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-6% 0px" }}
                      transition={{ duration: 0.35, delay: 0.3 + i * 0.06, ease }}
                    >
                      {q}
                    </motion.div>
                  ))}
                </div>

                <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-ink px-3 py-2 text-[12px] leading-snug text-white">
                  What&apos;s included in the free trial?
                </div>

                <motion.div
                  className="max-w-[92%] rounded-2xl rounded-tl-sm bg-clay px-3 py-2.5 text-[12px] leading-snug text-ink"
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-6% 0px" }}
                  transition={{ duration: 0.4, delay: 0.45, ease }}
                >
                  The 14-day trial includes full access to all features, up to 1,000 messages, and
                  unlimited knowledge sources. No credit card required.
                  <span className="mt-1.5 flex items-center gap-1 font-mono text-[9px] text-mute">
                    <MessageSquareText className="h-3 w-3" strokeWidth={1.5} />
                    Source: Pricing FAQ
                  </span>
                </motion.div>
              </div>

              <div className="border-t border-ink/[0.06] px-3 py-2.5">
                <div className="rounded-full border border-ink/[0.1] bg-white px-3.5 py-2 text-[11px] text-mute">
                  Type a message...
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
