"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export function WidgetProductMock() {
  const reduce = useReducedMotion();

  return (
    <div className="relative mx-auto w-full min-w-0">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.8)_0%,transparent_65%)] sm:-inset-10"
      />

      <motion.div
        className="relative overflow-hidden rounded-[1.25rem] border border-ink/[0.08] bg-white shadow-[0_24px_60px_rgba(10,10,10,0.07)] sm:rounded-[1.5rem]"
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.06, ease }}
      >
        <div className="flex items-center gap-2 border-b border-ink/[0.06] px-3 py-2.5 sm:px-5 sm:py-3">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-ink/15" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-ink/15" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-ink/15" />
          <div className="ml-1 min-w-0 flex-1 rounded-lg border border-ink/[0.08] bg-white px-2.5 py-1.5 sm:ml-2 sm:px-4">
            <p className="truncate font-mono text-[10px] text-ink/70 sm:text-xs">yoursite.com</p>
          </div>
        </div>

        <div className="flex flex-col bg-clay/45 px-4 pb-4 pt-6 sm:px-8 sm:pb-6 sm:pt-10 md:relative md:min-h-[460px] md:px-10 md:pt-11">
          <motion.div
            className="relative z-10 max-w-sm min-w-0"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2, ease }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute/80 sm:text-[11px]">
              Your website
            </p>
            <p className="mt-2 font-display text-lg font-bold leading-snug text-ink sm:mt-2.5 sm:text-2xl">
              Welcome — how can we help?
            </p>
            <div className="mt-4 space-y-2 sm:mt-5">
              <div className="h-2 w-[70%] rounded-full bg-ink/[0.06]" />
              <div className="h-2 w-[52%] rounded-full bg-ink/[0.05]" />
              <div className="h-2 w-[60%] rounded-full bg-ink/[0.05]" />
            </div>

            <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:flex-wrap">
              <Link
                href="/register"
                className="qs-btn-primary w-full justify-center !px-5 !py-2.5 text-xs sm:w-auto sm:text-sm"
              >
                Get started
              </Link>
              <span className="relative inline-flex w-full sm:w-auto">
                <motion.a
                  href="#how"
                  className="qs-btn-ghost relative z-[1] w-full justify-center !px-5 !py-2.5 text-xs sm:w-auto sm:text-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("how")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  animate={
                    reduce
                      ? undefined
                      : {
                          scale: [1, 1.03, 1],
                          boxShadow: [
                            "0 0 0 0 rgba(10,10,10,0)",
                            "0 0 0 6px rgba(10,10,10,0.06)",
                            "0 0 0 0 rgba(10,10,10,0)",
                          ],
                        }
                  }
                  transition={
                    reduce
                      ? undefined
                      : { duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 1.4 }
                  }
                  whileHover={reduce ? undefined : { scale: 1.04 }}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                >
                  See how it works
                </motion.a>

                {!reduce && (
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute z-[2] hidden text-ink sm:block"
                    style={{ top: "-0.15rem", right: "-4rem" }}
                    animate={{
                      x: [0, -6, -10, -10, -6, 0],
                      y: [0, 4, 10, 10, 4, 0],
                      scale: [1, 1, 0.94, 0.94, 1, 1],
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      ease: [0.45, 0.05, 0.25, 1],
                      times: [0, 0.25, 0.45, 0.55, 0.75, 1],
                      repeatDelay: 0.25,
                    }}
                  >
                    <svg
                      width="44"
                      height="44"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="drop-shadow-md"
                      style={{
                        transform: "rotate(250deg)",
                        transformOrigin: "5.5px 3.5px",
                      }}
                    >
                      <path
                        d="M5.5 3.5l12.5 8.2-5.4 1.3 2.6 6.4-2.3.9-2.7-6.5L5.5 17.8V3.5z"
                        fill="currentColor"
                        stroke="#fff"
                        strokeWidth="1.4"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </motion.span>
                )}
              </span>
            </div>
          </motion.div>

          <motion.div
            className="relative mx-auto mt-5 flex h-[260px] w-full max-w-[300px] flex-col overflow-hidden rounded-2xl border border-ink/[0.1] bg-white shadow-[0_20px_50px_rgba(10,10,10,0.12)] sm:mt-6 sm:h-[300px] md:absolute md:bottom-8 md:right-9 md:mx-0 md:mt-0 md:h-[350px] md:w-[320px]"
            initial={reduce ? false : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.35, ease }}
          >
            <div className="flex shrink-0 items-center gap-2.5 border-b border-ink/[0.06] px-3.5 py-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-white">
                QS
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-ink">QuickStart AI</p>
                <p className="text-[10px] text-mute">Online</p>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col justify-end gap-2.5 overflow-hidden px-3.5 py-3">
              {[
                {
                  side: "bot" as const,
                  text: "Hi — ask me anything about this site.",
                  delay: 0.5,
                },
                {
                  side: "user" as const,
                  text: "What are your support hours?",
                  delay: 0.7,
                },
                {
                  side: "bot" as const,
                  text: "Mon–Fri, 9am–6pm. Happy to help.",
                  delay: 0.9,
                },
              ].map((m) => (
                <motion.div
                  key={m.text}
                  className={
                    m.side === "user"
                      ? "ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-ink px-3 py-2 text-[11px] leading-snug text-white sm:text-[12px]"
                      : "max-w-[92%] rounded-2xl rounded-tl-sm bg-clay px-3 py-2 text-[11px] leading-snug text-ink sm:text-[12px]"
                  }
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: m.delay, ease }}
                >
                  {m.text}
                </motion.div>
              ))}
            </div>

            <div className="shrink-0 border-t border-ink/[0.06] px-3 py-2.5">
              <div className="rounded-full border border-ink/[0.1] bg-white px-3.5 py-2 text-[11px] text-mute">
                Type a message…
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
