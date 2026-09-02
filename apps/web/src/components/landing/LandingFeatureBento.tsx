"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Bot,
  Check,
  FileText,
  Gift,
  KeyRound,
  Lock,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/FadeIn";

const ease = [0.22, 1, 0.36, 1] as const;

const ROW = "flex items-center gap-3 rounded-xl bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(10,10,10,0.05)]";
const TILE = "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-clay text-ink";

function MockRow({
  index,
  className,
  children,
}: {
  index: number;
  className?: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`${ROW} ${className ?? ""}`}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.45, delay: 0.08 * index, ease }}
    >
      {children}
    </motion.div>
  );
}

function KnowledgeMock() {
  const sources = ["Pricing page", "Refund policy", "Help center"];

  return (
    <div className="w-full max-w-[300px] space-y-2.5">
      {sources.map((source, i) => (
        <MockRow key={source} index={i}>
          <span className={TILE}>
            <FileText className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </span>
          <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">{source}</p>
          <span className="shrink-0 rounded-md bg-clay px-2 py-0.5 text-[10px] font-semibold text-ink">
            Added
          </span>
        </MockRow>
      ))}
    </div>
  );
}

function ConversationsMock() {
  const chats = [
    { initial: "S", question: "Do you offer annual billing?", meta: "Answered" },
    { initial: "M", question: "I need to talk to sales.", meta: "Sent to your team" },
    { initial: "J", question: "Where are the API docs?", meta: "Answered" },
  ];

  return (
    <div className="w-full max-w-[300px] space-y-2.5">
      {chats.map((chat, i) => (
        <MockRow key={chat.question} index={i}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-white">
            {chat.initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ink">{chat.question}</p>
            <p className="mt-0.5 text-[11px] text-mute">{chat.meta}</p>
          </div>
        </MockRow>
      ))}
    </div>
  );
}

function SecurityMock() {
  const credentials = [
    { icon: Check, label: "client_id", value: "qs_live_8f2a…", note: "Safe in the browser" },
    { icon: Lock, label: "client_secret", value: "••••••••••••", note: "Stays on your server" },
  ];

  return (
    <div className="w-full max-w-[300px] space-y-2.5">
      {credentials.map((credential, i) => {
        const Icon = credential.icon;
        return (
          <MockRow key={credential.label} index={i}>
            <span className={TILE}>
              <Icon className="h-4 w-4" strokeWidth={1.9} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[11px] text-mute">{credential.label}</p>
              <p className="truncate font-mono text-[12px] font-semibold text-ink">
                {credential.value}
              </p>
            </div>
            <span className="hidden shrink-0 text-[10px] font-medium text-mute sm:block">
              {credential.note}
            </span>
          </MockRow>
        );
      })}
    </div>
  );
}

function EmbedMock() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="w-full max-w-[300px] overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(10,10,10,0.05)]"
      initial={reduce ? false : { opacity: 0, y: 10 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.5, ease }}
    >
      <div className="flex items-center gap-2 border-b border-ink/[0.06] px-3.5 py-2.5">
        <span className="h-2 w-2 rounded-full bg-ink/15" aria-hidden />
        <span className="rounded-md bg-clay px-2 py-1 text-[10px] text-mute">yourwebsite.com</span>
      </div>
      <div className="relative h-[124px] bg-clay/45 p-3.5">
        <span className="block h-2 w-24 rounded-full bg-ink/[0.09]" aria-hidden />
        <span className="mt-2 block h-2 w-32 rounded-full bg-ink/[0.06]" aria-hidden />

        <div className="absolute bottom-3.5 right-3.5 flex items-end gap-2">
          <span className="rounded-2xl rounded-br-sm bg-white px-2.5 py-1.5 text-[10px] font-medium text-ink shadow-[0_2px_6px_rgba(10,10,10,0.08)]">
            Need any help?
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white">
            <Bot className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

const CARDS: { title: string; body: string; visual: React.ReactNode }[] = [
  {
    title: "Trained on your content",
    body: "Add your FAQs, pricing, and policies. Answers come from what you wrote — nothing invented.",
    visual: <KnowledgeMock />,
  },
  {
    title: "Every conversation, saved",
    body: "See what visitors asked and how each chat ended, all from your dashboard.",
    visual: <ConversationsMock />,
  },
  {
    title: "Secure by design",
    body: "Only a public ID goes in your page. Your secret key never leaves the server.",
    visual: <SecurityMock />,
  },
  {
    title: "Works on any website",
    body: "React apps or plain HTML — the same chatbot, added with a single line of code.",
    visual: <EmbedMock />,
  },
];

const HIGHLIGHTS: { title: string; body: string; icon: LucideIcon }[] = [
  {
    title: "Free to start",
    body: "Build a chatbot, add your knowledge, and embed it without a credit card.",
    icon: Gift,
  },
  {
    title: "Bring your own key",
    body: "Prefer your own AI provider? Use your key and keep usage under your control.",
    icon: KeyRound,
  },
  {
    title: "Answers around the clock",
    body: "Visitors get help at any hour, even when your team is offline.",
    icon: MessageSquare,
  },
];

export function LandingFeatureBento() {
  return (
    <section className="border-t border-ink/[0.08] bg-white px-4 py-16 sm:px-6 sm:py-20 md:px-12 md:py-28">
      <div className="mx-auto max-w-6xl min-w-0">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="qs-eyebrow">Features</p>
          <h2 className="mt-4 qs-section-title">One chatbot, every part of your site.</h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-mute sm:text-base md:text-lg">
            Everything you need to answer visitors well — and nothing you have to configure to get
            started.
          </p>
        </FadeIn>

        <Stagger className="mt-12 grid gap-5 sm:mt-14 lg:grid-cols-2" delay={0.06}>
          {CARDS.map((card) => (
            <StaggerItem
              key={card.title}
              className="flex h-full flex-col overflow-hidden rounded-3xl border border-ink/[0.08] bg-clay"
            >
              <div className="flex min-h-[220px] flex-1 items-center justify-center p-7 sm:p-8">
                {card.visual}
              </div>
              <div className="border-t border-ink/[0.08] bg-white p-6 sm:p-7">
                <h3 className="text-base font-bold text-ink">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{card.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <Stagger className="mt-5 grid gap-5 sm:grid-cols-3" delay={0.06}>
          {HIGHLIGHTS.map((highlight) => {
            const Icon = highlight.icon;
            return (
              <StaggerItem
                key={highlight.title}
                className="h-full rounded-3xl border border-ink/[0.08] bg-clay p-6 sm:p-7"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-ink shadow-[0_1px_2px_rgba(10,10,10,0.05)]">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-bold text-ink">{highlight.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{highlight.body}</p>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
