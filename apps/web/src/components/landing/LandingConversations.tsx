"use client";

import { type FormEvent, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/FadeIn";

const ease = [0.22, 1, 0.36, 1] as const;

const CONVERSATIONS = [
  {
    name: "Sarah",
    preview: "Do you have annual pricing?",
    tag: "Pricing",
    intent: "High intent",
    time: "2m ago",
    selected: true,
  },
  {
    name: "Mike",
    preview: "I need to talk to someone about an enterprise plan.",
    tag: "Support",
    intent: "Human requested",
    time: "8m ago",
    selected: false,
  },
  {
    name: "Jessica",
    preview: "Where can I download the API docs?",
    tag: "Documentation",
    intent: "Resolved",
    time: "14m ago",
    selected: false,
  },
  {
    name: "Alex",
    preview: "Can I cancel my account?",
    tag: "Billing",
    intent: "Needs review",
    time: "22m ago",
    selected: false,
  },
];

const MESSAGES = [
  {
    side: "visitor",
    body: "Hi! Do you have annual pricing?",
  },
  {
    side: "agent",
    body: "Yes — annual plans save 20%. Want me to set up a trial?",
  },
  {
    side: "visitor",
    body: "Great. Can I speak to someone about enterprise pricing?",
  },
] as const;

export function LandingConversations() {
  const reduce = useReducedMotion();
  const [messages, setMessages] = useState([...MESSAGES]);
  const [draft, setDraft] = useState("");

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setMessages((current) => [...current, { side: "agent" as const, body }]);
    setDraft("");
  }

  return (
    <section className="border-t border-ink/[0.08] bg-white px-4 py-16 sm:px-6 sm:py-20 md:px-12 md:py-28">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="qs-eyebrow">Conversations</p>
          <h2 className="mt-3 font-sans text-2xl font-bold leading-[1.12] tracking-[-0.02em] text-ink sm:text-3xl md:text-[2.75rem]">
            Don&apos;t just answer questions.
            <br />
            <span className="text-mute">See what visitors are trying to do.</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-12 sm:mt-14">
          <div className="overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-[0_24px_60px_rgba(10,10,10,0.08)] lg:flex lg:h-[600px] lg:flex-col">
            <div className="flex items-center justify-between border-b border-ink/[0.08] px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2.5">
                <p className="text-sm font-semibold text-ink">Inbox</p>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold text-white">
                  4 active
                </span>
                <span className="font-mono text-[10px] text-mute">Today</span>
              </div>
            </div>

            <div className="grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.55fr)]">
              <Stagger className="divide-y divide-ink/[0.06] lg:border-r lg:border-ink/[0.08]" delay={0.04}>
                {CONVERSATIONS.map((c) => (
                  <StaggerItem key={c.name}>
                    <div
                      className={`flex items-start gap-2.5 px-4 py-3.5 transition sm:px-5 ${
                        c.selected ? "bg-clay" : "hover:bg-clay/50"
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-white">
                        {c.name[0]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-ink">{c.name}</p>
                          <span className="shrink-0 font-mono text-[10px] text-mute">
                            {c.time}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-mute">{c.preview}</p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="rounded-md bg-ink/[0.05] px-2 py-0.5 text-[10px] font-medium text-ink">
                            {c.tag}
                          </span>
                          <span className="text-[10px] text-mute">{c.intent}</span>
                        </div>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>

              <motion.div
                className="flex min-h-[500px] flex-col border-t border-ink/[0.08] p-5 sm:p-6 lg:h-full lg:min-h-0 lg:border-t-0 lg:px-7"
                initial={reduce ? false : { opacity: 0 }}
                whileInView={reduce ? undefined : { opacity: 1 }}
                viewport={{ once: true, margin: "-8% 0px" }}
                transition={{ duration: 0.5, delay: 0.3, ease }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                      S
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">Sarah</p>
                      <p className="text-xs text-mute">yoursite.com/pricing</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-ink/[0.05] px-2.5 py-1 text-[10px] font-semibold text-ink">
                      High intent
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-1 flex-col gap-3">
                  {messages.map((message, index) => (
                    <motion.div
                      key={`${message.body}-${index}`}
                      className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm ${
                        message.side === "agent"
                          ? "ml-auto rounded-br-md bg-ink text-white"
                          : "rounded-tl-md bg-clay text-ink"
                      }`}
                      initial={reduce ? false : { opacity: 0, y: 10 }}
                      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-8% 0px" }}
                      transition={{ duration: 0.45, delay: 0.45 + index * 0.35, ease }}
                    >
                      {message.body}
                    </motion.div>
                  ))}
                  <motion.div
                    className="mt-auto flex w-fit items-center gap-1 rounded-full border border-ink/[0.08] bg-white px-3 py-1.5"
                    initial={reduce ? false : { opacity: 0 }}
                    whileInView={reduce ? undefined : { opacity: 1 }}
                    viewport={{ once: true, margin: "-8% 0px" }}
                    transition={{ duration: 0.4, delay: 1.55, ease }}
                  >
                    <span className="qs-chat-bounce h-1.5 w-1.5 rounded-full bg-mute" />
                    <span className="qs-chat-bounce h-1.5 w-1.5 rounded-full bg-mute [animation-delay:120ms]" />
                    <span className="qs-chat-bounce h-1.5 w-1.5 rounded-full bg-mute [animation-delay:240ms]" />
                    <span className="ml-1 text-[10px] text-mute">Replying</span>
                  </motion.div>
                </div>

                <form
                  onSubmit={sendMessage}
                  className="mt-5 flex items-center gap-2 rounded-xl border border-ink/[0.1] bg-clay/40 p-1.5 pl-3 focus-within:border-ink/30"
                >
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Type a message..."
                    aria-label="Type a message"
                    className="min-w-0 flex-1 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-mute"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-ink px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-inkHover disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!draft.trim()}
                  >
                    Send
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
