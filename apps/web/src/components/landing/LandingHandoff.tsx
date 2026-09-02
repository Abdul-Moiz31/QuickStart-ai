"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";

const ease = [0.22, 1, 0.36, 1] as const;

export function LandingHandoff() {
  const reduce = useReducedMotion();

  return (
    <section className="border-t border-ink/[0.08] bg-clay px-4 py-16 sm:px-6 sm:py-20 md:px-12 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-20">
        <FadeIn delay={0.1} className="order-2 min-w-0 lg:order-1">
          <div className="overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-soft">
            <div className="border-b border-ink/[0.08] px-5 py-3.5">
              <p className="text-sm font-semibold text-ink">Conversation &middot; Mike</p>
            </div>

            <div className="space-y-3 p-5">
              <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-clay px-4 py-2.5 text-sm text-ink">
                I need help with an enterprise plan for 200+ seats.
              </div>
              <motion.div
                className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm text-white"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-6% 0px" }}
                transition={{ duration: 0.45, delay: 0.2, ease }}
              >
                I can help with general pricing, but let me connect you with our team who handles
                enterprise plans.
              </motion.div>

              <motion.div
                className="my-4 flex items-center gap-3"
                initial={reduce ? false : { opacity: 0, scaleX: 0.6 }}
                whileInView={reduce ? undefined : { opacity: 1, scaleX: 1 }}
                viewport={{ once: true, margin: "-6% 0px" }}
                transition={{ duration: 0.5, delay: 0.35, ease }}
              >
                <div className="h-px flex-1 bg-ink/[0.08]" />
                <div className="flex items-center gap-2 rounded-full border border-ink/[0.08] bg-clay px-3 py-1.5">
                  <ArrowRight className="h-3.5 w-3.5 text-ink" strokeWidth={2} />
                  <span className="text-xs font-semibold text-ink">David joined</span>
                </div>
                <div className="h-px flex-1 bg-ink/[0.08]" />
              </motion.div>

              <motion.div
                className="rounded-xl border border-ink/[0.06] bg-porcelain px-4 py-3"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-6% 0px" }}
                transition={{ duration: 0.45, delay: 0.45, ease }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
                  Context for David
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-mute">
                  Visitor from enterprise pricing page. Needs 200+ seats. AI answered general
                  pricing questions before handoff.
                </p>
              </motion.div>

              <motion.div
                className="max-w-[85%] rounded-2xl rounded-tl-md bg-clay px-4 py-2.5 text-sm text-ink"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-6% 0px" }}
                transition={{ duration: 0.45, delay: 0.55, ease }}
              >
                Hi Mike, I&apos;m David from our partnerships team. I can see you&apos;re looking at
                enterprise. Let me walk you through volume pricing.
              </motion.div>
            </div>
          </div>
        </FadeIn>

        <FadeIn className="order-1 min-w-0 lg:order-2">
          <p className="qs-eyebrow">Human handoff</p>
          <h2 className="mt-3 font-sans text-2xl font-bold leading-[1.12] tracking-[-0.02em] text-ink sm:text-3xl md:text-4xl">
            Seamlessly hand off to your team when it matters.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-mute sm:text-base md:text-lg">
            When a visitor requests a human, your team joins the conversation with full context. No
            repeated questions, no lost history.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
