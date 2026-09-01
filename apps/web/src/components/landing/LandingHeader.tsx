"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredToken } from "@/lib/api";

export function LandingHeader() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(Boolean(getStoredToken()));
  }, []);

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-4 sm:pt-4 md:px-6 md:pt-5">
      <div className="mx-auto flex max-w-3xl min-w-0 items-center justify-between gap-2 rounded-3xl bg-porcelain px-2.5 py-2 shadow-nav sm:gap-3 sm:px-4 sm:py-2.5">
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
          {loggedIn ? (
            <Link
              href="/dashboard"
              className="qs-btn-primary !px-3 !py-2 text-xs sm:!px-5 sm:!py-2 sm:text-sm"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-2.5 py-2 text-mute transition hover:bg-clay hover:text-ink sm:px-3"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="qs-btn-primary !px-3 !py-2 text-xs sm:!px-5 sm:!py-2 sm:text-sm"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
