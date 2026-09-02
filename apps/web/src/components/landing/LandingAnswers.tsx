"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";

const ease = [0.22, 1, 0.36, 1] as const;

export function LandingAnswers() {
  const reduce = useReducedMotion();

  return (
    <section className="border-t border-ink/[0.08] bg-clay px-4 py-16 sm:px-6 sm:py-20 md:px-12 md:py-28">
      <div className="mx-auto max-w-4xl text-center">
        <FadeIn>
          <p className="qs-eyebrow">Better answers</p>
          <h2 className="mt-3 font-sans text-2xl font-bold leading-[1.12] tracking-[-0.02em] text-ink sm:text-3xl md:text-[2.75rem]">
            Good answers start with the right context.
          </h2>
        </FadeIn>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:mt-14 lg:grid-cols-2">
        <motion.div
          className="overflow-hidden rounded-2xl border border-ink/[0.08] bg-white"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 0.6, ease }}
        >
          <div className="flex items-center gap-2 border-b border-ink/[0.08] px-5 py-3.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink/[0.06]">
              <X className="h-3.5 w-3.5 text-mute" strokeWidth={2} />
            </span>
            <p className="text-sm font-semibold text-mute">Generic answer</p>
          </div>
          <div className="p-6 sm:p-7">
            <p className="rounded-xl bg-clay px-4 py-3 text-sm text-ink">
              Can I cancel after my trial ends?
            </p>
            <div className="mt-5 rounded-xl border border-ink/[0.06] bg-porcelain px-4 py-3.5">
              <p className="text-sm leading-relaxed text-mute">
                Cancellation policies vary. Please check with the company for their specific terms
                and conditions regarding trial periods and subscriptions.
              </p>
            </div>
            <p className="mt-4 text-xs text-mute/70">No source available</p>
          </div>
        </motion.div>

        <motion.div
          className="overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-soft"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
        >
          <div className="flex items-center gap-2 border-b border-ink/[0.08] px-5 py-3.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink">
              <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            </span>
            <p className="text-sm font-semibold text-ink">QuickStart answer</p>
          </div>
          <div className="p-6 sm:p-7">
            <p className="rounded-xl bg-clay px-4 py-3 text-sm text-ink">
              Can I cancel after my trial ends?
            </p>
            <div className="mt-5 rounded-xl border border-ink/[0.08] bg-white px-4 py-3.5 shadow-soft">
              <p className="text-sm leading-relaxed text-ink">
                Yes. You can cancel anytime before your 14-day trial ends at no cost. After the
                trial, your plan renews monthly and you can cancel from your account settings.
                Refunds are available within the first 14 days of any paid period.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-ink" strokeWidth={2.5} />
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
                Source: Cancellation Policy
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
