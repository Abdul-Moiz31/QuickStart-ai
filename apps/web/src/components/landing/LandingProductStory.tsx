"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, FileText, MessageSquareText } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";

const ease = [0.22, 1, 0.36, 1] as const;

export function LandingProductStory() {
  const reduce = useReducedMotion();

  return (
    <section className="border-t border-ink/[0.08] bg-clay px-4 py-12 sm:px-6 sm:py-16 md:px-12 md:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
        <FadeIn className="min-w-0">
          <p className="qs-eyebrow">Knowledge, put to work</p>
          <h2 className="mt-3 qs-section-title">
            Answers that feel
            <br />
            considered.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-mute sm:text-base md:text-lg">
            Your content is the source of truth. QuickStart turns it into a clear response, shows
            where it came from, and leaves your team the full context.
          </p>
          <a
            href="#install"
            className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-ink"
          >
            See how it works
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </FadeIn>

        <FadeIn delay={0.12} className="min-w-0">
          <div className="overflow-hidden rounded-3xl border border-ink/[0.1] bg-white shadow-[0_24px_70px_rgba(10,10,10,0.1)]">
            <div className="flex items-center justify-between border-b border-ink/[0.08] px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-white">
                  <MessageSquareText className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">Conversation</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
                    Product support
                  </p>
                </div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
                10:42 AM
              </span>
            </div>

            <div className="grid gap-0 bg-porcelain md:grid-cols-[0.85fr_1.15fr]">
              <div className="border-b border-ink/[0.08] p-5 md:border-b-0 md:border-r sm:p-7">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
                  Visitor asks
                </p>
                <motion.div
                  className="mt-4 rounded-2xl rounded-tl-md bg-ink px-4 py-3 text-sm leading-relaxed text-white"
                  initial={reduce ? false : { opacity: 0, x: 16 }}
                  whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-8% 0px" }}
                  transition={{ duration: 0.55, ease }}
                >
                  Do you offer onboarding for new teams?
                </motion.div>
                <div className="mt-6 flex items-center gap-2 border-t border-ink/[0.08] pt-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white">
                    <FileText className="h-3.5 w-3.5 text-ink" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
                      Matched source
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-ink">Getting started guide</p>
                  </div>
                </div>
              </div>

              <motion.div
                className="bg-white p-5 sm:p-7"
                initial={reduce ? false : { opacity: 0, y: 14 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-8% 0px" }}
                transition={{ duration: 0.55, delay: 0.16, ease }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
                  Suggested reply
                </p>
                <p className="mt-4 text-sm leading-relaxed text-ink">
                  Yes. Our team onboarding includes a guided setup, workspace configuration, and
                  support for your first launch.
                </p>
                <div className="mt-6 flex items-center justify-between gap-3 border-t border-ink/[0.08] pt-4">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
                    <Check className="h-3.5 w-3.5 text-ink" strokeWidth={2.5} />
                    Grounded in your content
                  </span>
                  <span className="rounded-full bg-clay px-2.5 py-1 text-[10px] font-semibold text-ink">
                    Send
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
