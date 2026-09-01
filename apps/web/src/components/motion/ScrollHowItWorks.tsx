"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Bot, Check, Code2, FileText, type LucideIcon } from "lucide-react";
import { getStoredToken } from "@/lib/api";

const STEPS: {
  title: string;
  body: string;
  detail: string;
  icon: LucideIcon;
  cta: { label: string; hrefLoggedIn: string; hrefGuest: string };
}[] = [
  {
    title: "Create your chatbot",
    body: "Sign up and open a project. You get a client ID to connect the widget — ready in minutes.",
    detail: "One project per site or brand",
    icon: Bot,
    cta: {
      label: "Create chatbot",
      hrefLoggedIn: "/dashboard",
      hrefGuest: "/register",
    },
  },
  {
    title: "Add your knowledge",
    body: "Paste FAQs, pricing, and policies. The chatbot learns from what you upload so answers stay accurate.",
    detail: "Your content · your answers",
    icon: FileText,
    cta: {
      label: "Add knowledge",
      hrefLoggedIn: "/dashboard",
      hrefGuest: "/register",
    },
  },
  {
    title: "Paste one line on your site",
    body: "Drop in a React component or a single script tag. Visitors chat on your site right away.",
    detail: "React or HTML · same setup",
    icon: Code2,
    cta: {
      label: "See install code",
      hrefLoggedIn: "#install",
      hrefGuest: "#install",
    },
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function ScrollHowItWorks() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    setLoggedIn(Boolean(getStoredToken()));
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el || reduce) return;

    const media = window.matchMedia("(min-width: 1024px)");
    let ctx: gsap.Context | undefined;
    let last = 0;

    const setup = () => {
      ctx?.revert();
      ctx = undefined;
      last = 0;

      if (!media.matches) return;

      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: "+=180%",
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
          onUpdate: (self) => {
            const idx = Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length));
            if (idx !== last) {
              last = idx;
              setActive(idx);
            }
          },
        });
      }, el);
    };

    setup();
    media.addEventListener("change", setup);
    return () => {
      media.removeEventListener("change", setup);
      ctx?.revert();
    };
  }, [reduce]);

  const step = STEPS[active]!;
  const StepIcon = step.icon;
  const progress = (active + 1) / STEPS.length;
  const ctaHref = loggedIn ? step.cta.hrefLoggedIn : step.cta.hrefGuest;

  return (
    <section
      id="how"
      ref={root}
      className="relative scroll-mt-20 bg-clay px-4 sm:px-6 md:px-12 lg:min-h-[100svh] lg:scroll-mt-0"
    >
      <div className="mx-auto flex max-w-6xl flex-col justify-center py-12 sm:py-16 lg:min-h-[100svh] lg:py-20">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="min-w-0">
            <p className="qs-eyebrow">
              How it works
            </p>
            <h2 className="mt-3 qs-section-title">
              Live in three steps
            </h2>
            <p className="mt-4 max-w-md text-sm text-mute sm:text-base md:text-lg">
              Create a chatbot, add your content, embed it. No complicated setup.
            </p>

            <div className="mt-8 h-1 w-full max-w-sm overflow-hidden rounded-full bg-ink/10">
              <motion.div
                className="h-full origin-left rounded-full bg-ink"
                animate={{ scaleX: progress }}
                transition={{ duration: 0.35, ease }}
                style={{ transformOrigin: "left" }}
              />
            </div>

            <ol className="relative mt-8 space-y-0">
              {STEPS.map((s, i) => {
                const done = i < active;
                const current = i === active;
                const Icon = s.icon;
                return (
                  <li key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < STEPS.length - 1 && (
                      <span
                        aria-hidden
                        className={`absolute left-[17px] top-10 h-[calc(100%-1.25rem)] w-px ${
                          done ? "bg-ink" : "bg-ink/15"
                        }`}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      className="group flex w-full items-start gap-4 text-left"
                    >
                      <span
                        className={`relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${
                          current
                            ? "border-ink bg-ink text-white shadow-soft"
                            : done
                              ? "border-ink bg-ink text-white"
                              : "border-ink/20 bg-white text-mute group-hover:border-ink/40"
                        }`}
                      >
                        {done && !current ? (
                          <Check className="h-4 w-4" strokeWidth={2.5} />
                        ) : (
                          <Icon className="h-4 w-4" strokeWidth={1.75} />
                        )}
                      </span>
                      <span className="min-w-0 pt-1.5">
                        <span
                          className={`block text-[11px] font-mono uppercase tracking-[0.14em] ${
                            current ? "text-ink" : "text-mute"
                          }`}
                        >
                          Step 0{i + 1}
                        </span>
                        <span
                          className={`mt-1 block font-sans text-base font-bold transition ${
                            current ? "text-ink" : "text-mute group-hover:text-ink"
                          }`}
                        >
                          {s.title}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="relative min-h-0 overflow-hidden rounded-2xl border border-ink/[0.08] bg-white p-6 shadow-soft sm:min-h-[320px] sm:p-8 md:min-h-[360px] md:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.title}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-clay text-ink sm:h-12 sm:w-12">
                  <StepIcon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} />
                </div>
                <p className="qs-eyebrow mt-5 sm:mt-6">
                  Step 0{active + 1} of 0{STEPS.length}
                </p>
                <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-ink sm:text-2xl md:text-3xl">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-mute sm:mt-4 sm:text-base md:text-lg">
                  {step.body}
                </p>
                <p className="mt-5 inline-flex max-w-full rounded-full border border-ink/[0.08] bg-clay px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/70 sm:mt-6 sm:px-3.5 sm:text-[11px]">
                  {step.detail}
                </p>
                <div className="mt-6 sm:mt-8">
                  <Link href={ctaHref} className="qs-btn-primary inline-flex w-full justify-center sm:w-auto">
                    {step.cta.label}
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
