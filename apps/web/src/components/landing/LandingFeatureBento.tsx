"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  FileText,
  Gift,
  Globe,
  Image as ImageIcon,
  KeyRound,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/FadeIn";

const ease = [0.22, 1, 0.36, 1] as const;

function SourcesMock() {
  const reduce = useReducedMotion();
  const badges = [
    { icon: FileText, tint: "text-sky-500" },
    { icon: Globe, tint: "text-emerald-500" },
    { icon: MessageSquare, tint: "text-amber-500" },
  ];

  return (
    <div className="relative flex w-full flex-col items-center">
      <div className="flex gap-3">
        {badges.map(({ icon: Icon, tint }, i) => (
          <motion.span
            key={i}
            className={`flex h-11 w-11 items-center justify-center rounded-full border border-ink/[0.08] bg-white shadow-soft ${tint}`}
            initial={reduce ? false : { opacity: 0, y: -10 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8% 0px" }}
            transition={{ duration: 0.5, delay: 0.08 * i, ease }}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </motion.span>
        ))}
      </div>

      <motion.div
        className="relative z-10 mt-5 flex w-full max-w-[280px] items-center gap-3 rounded-2xl bg-ink px-4 py-3.5 shadow-soft"
        initial={reduce ? false : { opacity: 0, y: 12, scale: 0.97 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-8% 0px" }}
        transition={{ duration: 0.55, delay: 0.2, ease }}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
          <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-white">Answered from your FAQ</p>
          <p className="text-[11px] text-white/60">Refund policy · docs.pdf</p>
        </div>
      </motion.div>
    </div>
  );
}

function ConversationsMock() {
  const reduce = useReducedMotion();
  const rows = [
    { label: "Pricing question", meta: "3 replies", on: true },
    { label: "Billing issue", meta: "Escalated to team", on: true },
    { label: "General inquiry", meta: "Auto-resolved", on: false },
  ];

  return (
    <div className="w-full space-y-2.5">
      {rows.map((row, i) => (
        <motion.div
          key={row.label}
          className="flex items-center justify-between gap-3 rounded-xl bg-ink px-4 py-3"
          initial={reduce ? false : { opacity: 0, x: -12 }}
          whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 0.45, delay: 0.06 * i, ease }}
        >
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-white">{row.label}</p>
            <p className="text-[11px] text-white/50">{row.meta}</p>
          </div>
          <span
            className={`relative h-5 w-9 shrink-0 rounded-full transition ${
              row.on ? "bg-accent" : "bg-white/15"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
                row.on ? "left-[18px]" : "left-0.5"
              }`}
            />
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function SecurityMock() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="flex h-24 w-24 items-center justify-center rounded-2xl bg-ink shadow-soft"
      initial={reduce ? false : { opacity: 0, scale: 0.85 }}
      whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.5, ease }}
    >
      <ShieldCheck className="h-10 w-10 text-accent" strokeWidth={1.5} aria-hidden />
    </motion.div>
  );
}

function ImagePlaceholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink/20 bg-white/50 px-4 py-8 text-center">
      <ImageIcon className="h-6 w-6 text-mute" strokeWidth={1.5} aria-hidden />
      <p className="text-xs font-medium text-mute">
        Image pending — drop a screenshot of the widget live on a real site at
      </p>
      <code className="rounded-md bg-white px-2 py-1 font-mono text-[11px] text-ink">
        /public/images/features/works-anywhere.png
      </code>
    </div>
  );
}

const CARDS = [
  {
    title: "Trained on your docs",
    body: "Upload FAQs, pricing, and policies. The chatbot answers from your content — not random guesses.",
    visual: <SourcesMock />,
    minH: "min-h-[240px]",
  },
  {
    title: "See every conversation",
    body: "Review every chat from the dashboard so you always know what visitors ask and how they were helped.",
    visual: <ConversationsMock />,
    minH: "min-h-[240px]",
  },
  {
    title: "Secure by design",
    body: "Public client ID for the widget. Your secret stays on the server — never in the browser.",
    visual: <SecurityMock />,
    minH: "min-h-[180px]",
  },
  {
    title: "Works on any website",
    body: "React apps or plain HTML. Same chatbot everywhere your customers already visit.",
    visual: <ImagePlaceholder />,
    minH: "min-h-[180px]",
  },
] as const;

const HIGHLIGHTS = [
  {
    title: "Totally free to start",
    body: "Create a chatbot, add knowledge, and embed it at no cost. No credit card to get going.",
    icon: Gift,
  },
  {
    title: "Bring your own key",
    body: "Use your own AI API key. You stay in control of usage and billing with your provider.",
    icon: KeyRound,
  },
] as const;

export function LandingFeatureBento() {
  return (
    <section className="border-t border-ink/[0.08] bg-white px-4 py-12 sm:px-6 sm:py-16 md:px-12 md:py-20">
      <div className="mx-auto max-w-6xl min-w-0">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="qs-eyebrow">Features</p>
          <h2 className="mt-3 font-display text-3xl font-bold leading-[1.1] tracking-tight text-ink sm:text-4xl md:text-5xl">
            One chatbot.
            <br />
            Every part of your site.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-mute sm:text-base md:text-lg">
            Real product features — clear, useful, and built for your website chatbot.
          </p>
        </FadeIn>

        <Stagger className="mt-12 grid gap-5 lg:grid-cols-2" delay={0.06}>
          {CARDS.map((card) => (
            <StaggerItem
              key={card.title}
              className="overflow-hidden rounded-3xl border border-ink/[0.08] bg-clay"
            >
              <div className={`flex ${card.minH} items-center justify-center p-8`}>
                {card.visual}
              </div>
              <div className="border-t border-ink/[0.08] bg-white p-6 md:p-7">
                <h3 className="font-display text-base font-bold text-ink">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{card.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <Stagger className="mt-5 grid gap-4 sm:grid-cols-2" delay={0.06}>
          {HIGHLIGHTS.map((h) => {
            const Icon = h.icon;
            return (
              <StaggerItem
                key={h.title}
                className="flex items-start gap-3.5 rounded-2xl border border-ink/[0.08] bg-clay p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink/[0.1] bg-white text-ink">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-ink">{h.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-mute">{h.body}</p>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
