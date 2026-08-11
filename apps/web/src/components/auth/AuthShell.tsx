"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const reduce = useReducedMotion();

  return (
    <main className="min-h-screen overflow-x-hidden bg-clay text-ink">
      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-4 sm:pt-4 md:px-6 md:pt-5">
        <div className="mx-auto flex max-w-3xl min-w-0 items-center justify-between gap-2 rounded-full border border-ink/[0.08] bg-white px-2.5 py-2 shadow-soft sm:gap-3 sm:px-4 sm:py-2.5">
          <Link
            href="/"
            className="min-w-0 shrink truncate pl-1.5 font-display text-sm font-bold tracking-tight text-ink sm:pl-2 sm:text-base"
          >
            QuickStart AI
          </Link>
          <nav className="flex shrink-0 items-center gap-0.5 text-sm sm:gap-2">
            <Link
              href="/docs/embed"
              className="hidden rounded-full px-3 py-2 text-mute transition hover:bg-clay hover:text-ink sm:inline"
            >
              Docs
            </Link>
            <Link href="/register" className="qs-btn-primary !px-4 !py-2 text-xs sm:!px-5 sm:text-sm">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-md min-w-0 flex-col px-4 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-10 md:pt-14">
        <motion.div
          className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft sm:p-8"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-mute">Account</p>
          <h1 className="mt-3 font-sans text-2xl font-bold tracking-tight text-black sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-mute">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 border-t border-ink/[0.08] pt-6 text-sm text-mute">{footer}</div>
        </motion.div>
      </div>
    </main>
  );
}
