"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { WidgetProductMock } from "@/components/landing/WidgetProductMock";

const ease = [0.22, 1, 0.36, 1] as const;

export function LandingHero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-clay px-4 pb-6 pt-10 sm:px-6 sm:pb-8 sm:pt-14 md:pb-9 md:pt-20">
      <div className="mx-auto max-w-3xl min-w-0 text-center">
        <motion.p
          className="qs-eyebrow"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          AI chatbot for your website
        </motion.p>

        <motion.h1
          className="mt-4 font-display text-3xl font-bold leading-[1.1] tracking-tight text-ink sm:text-4xl md:text-5xl lg:text-6xl"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease }}
        >
          Turn your docs into a chatbot your visitors trust.
        </motion.h1>

        <motion.p
          className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-mute sm:text-base md:text-lg"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.16, ease }}
        >
          QuickStart AI answers questions using your FAQs and content, and drops into your site
          with one line of code. Free to start — no credit card required.
        </motion.p>

        <motion.div
          className="mt-7 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.24, ease }}
        >
          <Link
            href="/register"
            className="qs-btn-primary w-full justify-center !px-6 !py-3 text-sm sm:w-auto"
          >
            Create free account
          </Link>
          <a
            href="#how"
            className="qs-btn-ghost w-full justify-center !px-6 !py-3 text-sm sm:w-auto"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("how")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            See how it works
          </a>
        </motion.div>
      </div>

      <motion.div
        className="mx-auto mt-10 w-full max-w-full sm:mt-12 sm:max-w-[94%] md:mt-14 md:max-w-[85%] lg:max-w-[65%]"
        initial={reduce ? false : { opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.85, delay: 0.3, ease }}
      >
        <WidgetProductMock />
      </motion.div>
    </section>
  );
}
