"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FadeIn } from "@/components/motion/FadeIn";

const ease = [0.22, 1, 0.36, 1] as const;

const FRAGMENTS = [
  { label: "FAQ", preview: "What's your refund policy?" },
  { label: "Pricing", preview: "Pro plan — $49/mo" },
  { label: "Docs", preview: "Getting started guide" },
  { label: "Policies", preview: "14-day cancellation window" },
  { label: "Support", preview: "Mon–Fri, 9am–6pm" },
  { label: "Contact", preview: "support@yoursite.com" },
];

export function LandingProblem() {
  const reduce = useReducedMotion();

  return (
    <section className="border-t border-ink/[0.08] bg-clay px-4 py-16 sm:px-6 sm:py-20 md:px-12 md:py-28">
      <div className="mx-auto max-w-4xl text-center">
        <FadeIn>
          <h2 className="mx-auto max-w-3xl font-sans text-2xl font-bold leading-[1.15] tracking-[-0.02em] text-ink sm:text-3xl md:text-[2.75rem]">
            Most websites already contain the answers.
            <br />
            <span className="text-mute">Visitors just can&apos;t find them.</span>
          </h2>
        </FadeIn>
      </div>

      <div className="mx-auto mt-14 max-w-5xl sm:mt-16 md:mt-20">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {FRAGMENTS.map((f, i) => (
            <motion.div
              key={f.label}
              className="rounded-xl border border-ink/[0.08] bg-white px-4 py-4"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-6% 0px" }}
              transition={{ duration: 0.5, delay: i * 0.06, ease }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
                {f.label}
              </p>
              <p className="mt-2 text-xs font-medium leading-snug text-ink">{f.preview}</p>
            </motion.div>
          ))}
        </div>

        <FadeIn delay={0.2} className="mt-10 text-center sm:mt-12">
          <div className="inline-flex items-center gap-3 rounded-full border border-ink/[0.08] bg-white px-5 py-3 shadow-soft">
            <span className="text-sm text-mute">Visitor asks:</span>
            <span className="text-sm font-semibold text-ink">
              &ldquo;What&apos;s included in the Pro plan?&rdquo;
            </span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
