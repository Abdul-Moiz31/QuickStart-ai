"use client";

import { Shield, Eye, Server, Users, BookCheck, Settings } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/FadeIn";
import { FadeIn } from "@/components/motion/FadeIn";

const ITEMS = [
  {
    icon: Shield,
    title: "Data ownership",
    body: "Your knowledge stays in your project. Nothing is shared across accounts.",
  },
  {
    icon: Eye,
    title: "Source control",
    body: "Every answer links back to the content it was generated from.",
  },
  {
    icon: Server,
    title: "Server-side credentials",
    body: "API keys and secrets never leave your backend. The widget uses a safe client ID.",
  },
  {
    icon: Users,
    title: "Team permissions",
    body: "Invite teammates with scoped roles. Control who edits knowledge and who reviews conversations.",
  },
  {
    icon: BookCheck,
    title: "Answer review",
    body: "See unanswered questions and improve your knowledge base over time.",
  },
  {
    icon: Settings,
    title: "Provider choice",
    body: "Choose the LLM provider that fits your requirements — no lock-in.",
  },
];

export function LandingConfidence() {
  return (
    <section className="border-t border-ink/[0.08] bg-white px-4 py-16 sm:px-6 sm:py-20 md:px-12 md:py-28">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="qs-eyebrow">Built for trust</p>
          <h2 className="mt-3 font-sans text-2xl font-bold leading-[1.12] tracking-[-0.02em] text-ink sm:text-3xl md:text-[2.75rem]">
            You stay in control.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-mute sm:text-base md:text-lg">
            QuickStart is designed so your data, credentials, and team access are always under your
            authority.
          </p>
        </FadeIn>

        <Stagger
          className="mx-auto mt-12 grid max-w-5xl gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3"
          delay={0.04}
        >
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <StaggerItem
                key={item.title}
                className="rounded-2xl border border-ink/[0.08] bg-clay p-5 transition duration-300 hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-soft"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink/[0.08] bg-white text-ink">
                  <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 text-sm font-bold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{item.body}</p>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
