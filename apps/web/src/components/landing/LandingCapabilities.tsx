"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  FileText,
  Headset,
  MessageSquare,
  Palette,
  Plug,
  Users,
  Zap,
} from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/FadeIn";

const FEATURES = [
  {
    icon: FileText,
    label: "Knowledge",
    title: "Give it the right context.",
    body: "Bring in FAQs, docs, URLs, and policies so every answer starts with what your business actually knows.",
    className: "md:col-span-2",
  },
  {
    icon: MessageSquare,
    label: "Conversations",
    title: "See what visitors need.",
    body: "Review questions, replies, and outcomes in one calm workspace.",
    className: "",
  },
  {
    icon: Headset,
    label: "Human handoff",
    title: "Step in at the right moment.",
    body: "Take over when a conversation needs a person, without losing the context.",
    className: "",
  },
  {
    icon: BarChart3,
    label: "Analytics",
    title: "Improve what is working.",
    body: "Understand volume, response quality, and unanswered questions over time.",
    className: "",
  },
  {
    icon: Palette,
    label: "Appearance",
    title: "Make it feel like yours.",
    body: "Match the widget to your brand, site, and tone.",
    className: "",
  },
  {
    icon: Zap,
    label: "Triggers & events",
    title: "Notice the important moments.",
    body: "Create events for leads, keywords, escalations, and other signals.",
    className: "",
  },
  {
    icon: Plug,
    label: "Channels",
    title: "Meet visitors where they are.",
    body: "Extend the same support experience across the channels your team uses.",
    className: "",
  },
  {
    icon: Users,
    label: "Team access",
    title: "Work together with control.",
    body: "Invite teammates and give each person the access they need.",
    className: "",
  },
];

function KnowledgePreview() {
  const reduce = useReducedMotion();
  return (
    <div className="mt-7 grid gap-2 sm:grid-cols-3 md:max-w-xl">
      {[
        ["FAQ", "42 answers"],
        ["Website", "12 pages"],
        ["Policies", "Up to date"],
      ].map(([title, meta], index) => (
        <motion.div
          key={title}
          className="rounded-xl border border-ink/[0.08] bg-white px-3.5 py-3"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 0.45, delay: index * 0.08 }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">{title}</p>
          <p className="mt-1 text-xs font-semibold text-ink">{meta}</p>
        </motion.div>
      ))}
    </div>
  );
}

export function LandingCapabilities() {
  return (
    <section className="border-t border-ink/[0.08] bg-white px-4 py-12 sm:px-6 sm:py-16 md:px-12 md:py-20">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="qs-eyebrow">One workspace</p>
            <h2 className="mt-3 qs-section-title">Everything your support team needs.</h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-mute sm:text-base">
            From the first source you add to the handoff your team takes, every part of the
            experience stays connected.
          </p>
        </FadeIn>

        <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" delay={0.04}>
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <StaggerItem
                key={feature.label}
                className={`group rounded-2xl border border-ink/[0.08] bg-clay p-5 transition duration-300 hover:-translate-y-1 hover:border-ink/20 hover:bg-white hover:shadow-soft ${feature.className}`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink/[0.1] bg-white text-ink transition group-hover:bg-ink group-hover:text-white">
                    <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="font-mono text-[10px] text-mute">0{index + 1}</span>
                </div>
                <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
                  {feature.label}
                </p>
                <h3 className="mt-2 font-sans text-base font-bold tracking-tight text-ink">
                  {feature.title}
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-mute">{feature.body}</p>
                {feature.label === "Knowledge" && <KnowledgePreview />}
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
