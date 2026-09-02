"use client";

import Link from "next/link";
import { FadeIn } from "@/components/motion/FadeIn";

export function LandingInstall() {
  return (
    <section
      id="install"
      className="scroll-mt-20 border-t border-ink/[0.08] bg-clay px-4 py-16 sm:px-6 sm:py-20 md:px-12 md:py-28 lg:scroll-mt-24"
    >
      <div className="mx-auto max-w-6xl">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="qs-eyebrow">Installation</p>
          <h2 className="mt-3 font-sans text-2xl font-bold leading-[1.12] tracking-[-0.02em] text-ink sm:text-3xl md:text-[2.75rem]">
            Live on your site in minutes.
          </h2>
        </FadeIn>

        <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:mt-14 md:grid-cols-3">
          {[
            { step: "01", title: "Create a project", body: "Sign up and get a client ID." },
            { step: "02", title: "Add knowledge", body: "Paste your FAQs, docs, or website URL." },
            { step: "03", title: "Embed the widget", body: "One line of code — React or HTML." },
          ].map((s) => (
            <FadeIn key={s.step} delay={Number(s.step) * 0.06}>
              <div className="rounded-2xl border border-ink/[0.08] bg-white p-6">
                <span className="font-mono text-[10px] font-semibold text-mute">{s.step}</span>
                <h3 className="mt-3 text-sm font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{s.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.2} className="mx-auto mt-10 max-w-2xl sm:mt-12">
          <div className="qs-code-frame">
            <div className="qs-code-bar">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-sm font-medium text-white/90">Quick start</span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                html
              </span>
            </div>
            <pre className="qs-code-body">
              <code>
                <span className="qs-code-punct">&lt;</span>
                <span className="qs-code-tag">script</span>
                {"\n  "}
                <span className="qs-code-attr">src</span>
                <span className="qs-code-punct">=</span>
                <span className="qs-code-str">&quot;https://cdn.quickstart.ai/widget.js&quot;</span>
                {"\n  "}
                <span className="qs-code-attr">data-client-id</span>
                <span className="qs-code-punct">=</span>
                <span className="qs-code-str">&quot;qs_your_client_id&quot;</span>
                {"\n  "}
                <span className="qs-code-attr">async</span>
                {"\n"}
                <span className="qs-code-punct">&gt;&lt;/</span>
                <span className="qs-code-tag">script</span>
                <span className="qs-code-punct">&gt;</span>
              </code>
            </pre>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            <span className="text-sm font-medium text-ink">Widget is live</span>
          </div>
        </FadeIn>

        <FadeIn delay={0.25} className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="qs-btn-primary w-full justify-center !px-6 !py-3 text-sm sm:w-auto"
          >
            Create free account
          </Link>
          <Link
            href="/docs/embed"
            className="qs-btn-ghost w-full justify-center !px-6 !py-3 text-sm sm:w-auto"
          >
            Read documentation
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
