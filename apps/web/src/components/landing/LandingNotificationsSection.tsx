"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Bell, MessageSquare, Sparkles, Webhook, Zap } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";

const ease = [0.22, 1, 0.36, 1] as const;

const POINTS = [
  {
    icon: Zap,
    title: "Detects what matters",
    body: "Leads, handoffs, and support issues — picked up automatically from live chat.",
  },
  {
    icon: Sparkles,
    title: "Custom keyword events",
    body: "Alert your team when visitors mention pricing, refunds, or any words you choose.",
  },
  {
    icon: Bell,
    title: "Send anywhere",
    body: "Route alerts to Slack, Discord, or your own app with webhooks.",
  },
] as const;

const DESTINATIONS = [
  { label: "Slack", icon: MessageSquare },
  { label: "Discord", icon: MessageSquare },
  { label: "Webhook", icon: Webhook },
] as const;

function AlertsMock() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="overflow-hidden rounded-[1.35rem] border border-ink/[0.08] bg-white shadow-[0_24px_60px_rgba(10,10,10,0.08)]"
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.75, ease }}
    >
      <div className="flex items-center gap-2 border-b border-ink/[0.06] px-4 py-3 sm:px-5">
        <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
        <p className="ml-2 font-sans text-sm font-bold text-ink">Notifications</p>
      </div>

      <div className="space-y-4 bg-clay/35 p-5 sm:p-6">
        <div className="rounded-xl border border-ink/[0.08] bg-white p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-ink/[0.08] bg-clay">
              <Zap className="h-4 w-4 text-ink" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-sans text-sm font-bold text-ink">Lead captured</p>
              <p className="mt-1 text-xs leading-relaxed text-mute">
                Visitor asked for a demo and shared their email.
              </p>
              <p className="mt-2 font-mono text-[10px] text-mute">2 min ago · live chat</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-ink/[0.08] bg-white p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-ink/[0.08] bg-clay">
              <Sparkles className="h-4 w-4 text-ink" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-sans text-sm font-bold text-ink">Pricing question</p>
              <p className="mt-1 text-xs leading-relaxed text-mute">
                Keyword match: pricing, quote
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-ink/[0.08] bg-white/80 px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
            Delivered to
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {DESTINATIONS.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/[0.08] bg-clay px-3 py-1.5 text-xs font-medium text-ink"
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function LandingNotificationsSection() {
  return (
    <section className="border-t border-ink/[0.08] bg-clay px-4 py-12 sm:px-6 sm:py-16 md:px-12 md:py-20">
      <div className="mx-auto max-w-6xl min-w-0">
        <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="min-w-0 lg:order-2">
            <AlertsMock />
          </div>

          <div className="min-w-0 lg:order-1">
            <FadeIn>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-mute">
                Alerts & events
              </p>
              <h2 className="mt-3 font-sans text-2xl font-bold tracking-tight text-black sm:text-3xl md:text-4xl">
                Know when visitors need you
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-mute sm:text-base md:text-lg">
                Your chatbot keeps working 24/7. When someone asks for pricing, wants a human, or
                matches a keyword you care about — your team gets notified instantly.
              </p>
            </FadeIn>

            <FadeIn delay={0.08} className="mt-8 space-y-0">
              {POINTS.map((point) => {
                const Icon = point.icon;
                return (
                  <div
                    key={point.title}
                    className="flex gap-4 border-t border-ink/[0.08] py-5 first:border-t-0 first:pt-0"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink/[0.1] bg-white text-ink">
                      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <h3 className="font-sans text-base font-bold text-ink">{point.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-mute">{point.body}</p>
                    </div>
                  </div>
                );
              })}
            </FadeIn>

            <FadeIn delay={0.12} className="mt-8">
              <Link
                href="/register"
                className="qs-btn-primary inline-flex w-full justify-center !px-6 !py-2.5 text-sm sm:w-auto"
              >
                Get started free
              </Link>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
