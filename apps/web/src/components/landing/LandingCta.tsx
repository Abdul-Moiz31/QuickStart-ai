"use client";

import Link from "next/link";
import { FadeIn } from "@/components/motion/FadeIn";

export function LandingCta() {
  return (
    <section className="border-t border-ink/[0.08] bg-clay px-4 py-16 sm:px-6 sm:py-20 md:px-12 md:py-28">
      <FadeIn className="mx-auto max-w-3xl text-center">
        <h2 className="font-sans text-3xl font-bold leading-[1.08] tracking-[-0.02em] text-ink sm:text-4xl md:text-5xl">
          Put QuickStart AI on your site today.
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-mute sm:text-base md:text-lg">
          Create an account, add your knowledge, and embed the chatbot. Free to start — upgrade when
          you&apos;re ready.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="qs-btn-primary w-full justify-center !px-8 !py-3.5 text-sm sm:w-auto"
          >
            Start for free
          </Link>
          <Link
            href="/docs/embed"
            className="qs-btn-ghost w-full justify-center !px-8 !py-3.5 text-sm sm:w-auto"
          >
            Read documentation
          </Link>
        </div>
      </FadeIn>
    </section>
  );
}
