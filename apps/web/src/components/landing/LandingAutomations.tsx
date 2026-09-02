"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bell, Webhook, ChevronRight, Plus } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";

const ease = [0.22, 1, 0.36, 1] as const;

const RULES = [
  {
    keyword: "enterprise",
    intent: "High intent",
    actions: ["Notify #sales on Slack", "Tag as enterprise-lead"],
    active: true,
  },
  {
    keyword: "cancel",
    intent: "Churn risk",
    actions: ["Notify support team", "Send webhook to CRM"],
    active: true,
  },
  {
    keyword: "bug",
    intent: "Issue report",
    actions: ["Create ticket via webhook"],
    active: false,
  },
];

export function LandingAutomations() {
  const reduce = useReducedMotion();

  return (
    <section className="border-t border-ink/[0.08] bg-clay px-4 py-16 sm:px-6 sm:py-20 md:px-12 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-20">
        <FadeIn className="min-w-0">
          <p className="qs-eyebrow">Automations</p>
          <h2 className="mt-3 font-sans text-2xl font-bold leading-[1.12] tracking-[-0.02em] text-ink sm:text-3xl md:text-4xl">
            Turn conversations into workflows.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-mute sm:text-base md:text-lg">
            Set up rules based on keywords and visitor intent. Get notified, tag conversations, or
            push events to your tools — automatically.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="min-w-0">
          <div className="overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-soft">
            <div className="flex items-center justify-between border-b border-ink/[0.08] px-5 py-3.5">
              <p className="text-sm font-semibold text-ink">Trigger rules</p>
              <button className="flex h-8 items-center gap-1.5 rounded-lg bg-ink px-3 text-xs font-medium text-white">
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                New rule
              </button>
            </div>

            <div className="divide-y divide-ink/[0.06]">
              {RULES.map((r, i) => (
                <motion.div
                  key={r.keyword}
                  className="px-5 py-4"
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-6% 0px" }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-clay px-2 py-1 font-mono text-xs font-medium text-ink">
                        {r.keyword}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-mute" strokeWidth={1.75} />
                      <span className="rounded-md bg-ink/[0.04] px-2 py-1 text-xs text-ink">
                        {r.intent}
                      </span>
                    </div>
                    <div
                      className={`h-2 w-2 rounded-full ${
                        r.active ? "bg-ink" : "bg-ink/20"
                      }`}
                    />
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {r.actions.map((action) => (
                      <span
                        key={action}
                        className="flex items-center gap-1.5 text-xs text-mute"
                      >
                        {action.includes("webhook") ? (
                          <Webhook className="h-3 w-3" strokeWidth={1.5} />
                        ) : (
                          <Bell className="h-3 w-3" strokeWidth={1.5} />
                        )}
                        {action}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
