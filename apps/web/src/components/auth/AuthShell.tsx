"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function AuthShell({
  eyebrow = "Account",
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const reduce = useReducedMotion();

  return (
    <main className="min-h-screen overflow-x-hidden bg-clay text-ink">
      <div className="mx-auto flex w-full max-w-md min-w-0 flex-col px-4 pb-14 pt-10 sm:px-6 sm:pb-16 sm:pt-14 md:pt-16">
        <motion.div
          className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft sm:p-8"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link href="/" className="flex justify-center">
            <span className="truncate font-display text-base font-bold tracking-tight text-ink">
              QuickStart AI
            </span>
          </Link>

          <h1 className="mt-6 font-sans text-2xl font-bold tracking-tight text-black sm:text-3xl">
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
