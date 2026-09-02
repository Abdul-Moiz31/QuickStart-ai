import Link from "next/link";
import dynamic from "next/dynamic";
import { Bot, FileText } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/FadeIn";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingConversations } from "@/components/landing/LandingConversations";
import { LandingFeatureBento } from "@/components/landing/LandingFeatureBento";
import { LandingFeatureStrip } from "@/components/landing/LandingFeatureStrip";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingInsightHub } from "@/components/landing/LandingInsightHub";
import { LandingMcpSection } from "@/components/landing/LandingMcpSection";
import { LandingNotificationsSection } from "@/components/landing/LandingNotificationsSection";

const ScrollHowItWorks = dynamic(
  () => import("@/components/motion/ScrollHowItWorks").then((m) => m.ScrollHowItWorks),
  { loading: () => <div className="bg-clay lg:min-h-[100svh]" /> },
);

const SOURCE_PAGES = ["Pricing", "Help center", "FAQ"] as const;

const GENERATED_ANSWERS = [
  {
    question: "What does the Pro plan include?",
    answer: "Unlimited conversations, team access, and priority support.",
  },
  {
    question: "Can I invite my support team?",
    answer: "Yes. Add teammates and manage access from your dashboard.",
  },
  {
    question: "Where can I find setup help?",
    answer: "Your help center has guides for installation and configuration.",
  },
] as const;

export default function HomePage() {
  return (
    <main className="overflow-x-hidden bg-clay text-ink">
      <LandingHeader />

      <LandingHero />

      <LandingFeatureStrip />

      {/* What is QuickStart AI */}
      <section className="border-t border-ink/[0.08] bg-white px-4 py-16 sm:px-6 sm:py-20 md:px-12 md:py-28">
        <div className="mx-auto max-w-6xl">
          <FadeIn className="mx-auto max-w-3xl text-center">
            <p className="qs-eyebrow">What is QuickStart AI?</p>
            <h2 className="mt-4 font-sans text-3xl font-bold leading-[1.08] tracking-[-0.035em] text-ink sm:text-4xl md:text-5xl">
              Your website already has the answers.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-mute sm:text-lg">
              Give visitors a natural way to ask questions—and give them answers based on the
              content you already trust.
            </p>
          </FadeIn>

          <Stagger className="mx-auto mt-10 max-w-4xl sm:mt-14" delay={0.08}>
            <div className="qs-playground overflow-hidden rounded-3xl bg-white">
              <div className="grid lg:grid-cols-[0.85fr_0.42fr_1.35fr]">
                <div className="flex items-center p-5 sm:p-6">
                  <div className="w-full space-y-2">
                    {SOURCE_PAGES.map((page) => (
                      <StaggerItem
                        key={page}
                        className="flex items-center gap-3 rounded-xl bg-porcelain px-3.5 py-3"
                      >
                        <FileText className="h-4 w-4 shrink-0 text-ink" strokeWidth={1.75} aria-hidden />
                        <span className="text-sm font-semibold text-ink">{page}</span>
                      </StaggerItem>
                    ))}
                  </div>
                </div>

                <StaggerItem className="relative flex min-h-[120px] items-center justify-center bg-white p-6 lg:min-h-0">
                  <span className="qs-scrape-flow qs-scrape-flow-in absolute left-0 top-1/2 hidden h-px w-1/2 lg:block" />
                  <span className="qs-scrape-flow qs-scrape-flow-out absolute right-0 top-1/2 hidden h-px w-1/2 lg:block" />
                  <span className="qs-scrape-agent relative flex h-20 w-20 items-center justify-center rounded-full bg-ink text-white shadow-soft">
                    <Bot className="h-9 w-9" strokeWidth={1.5} aria-hidden />
                  </span>
                </StaggerItem>

                <div className="p-5 sm:p-6">
                  <div className="space-y-2.5">
                    {GENERATED_ANSWERS.map(({ question, answer }) => (
                      <StaggerItem
                        key={question}
                        className="flex items-center gap-3 rounded-xl bg-porcelain p-3.5 sm:p-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-ink">{question}</p>
                          <p className="mt-1 truncate text-xs text-mute">{answer}</p>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-[0_1px_3px_rgba(10,10,10,0.1)] transition hover:bg-clay"
                        >
                          Review
                        </button>
                      </StaggerItem>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Stagger>

          <FadeIn className="mt-8 flex justify-center" delay={0.12}>
            <a href="#install" className="qs-btn-primary w-full justify-center sm:w-auto">
              Make it live
            </a>
          </FadeIn>
        </div>
      </section>

      <LandingInsightHub />

      <LandingConversations />

      <ScrollHowItWorks />

      <LandingFeatureBento />

      <LandingNotificationsSection />

      <LandingMcpSection />

      {/* Install */}
      <section
        id="install"
        className="scroll-mt-20 border-t border-ink/[0.08] bg-clay px-4 py-12 sm:px-6 sm:py-14 md:px-12 md:py-16 lg:scroll-mt-24"
      >
        <div className="mx-auto max-w-6xl min-w-0">
          <FadeIn>
            <p className="qs-eyebrow">Install</p>
            <h2 className="mt-3 qs-section-title">
              One line of code
            </h2>
            <p className="mt-3 max-w-xl text-sm text-mute sm:text-base">
              Same chatbot for React and HTML. Never put your secret in frontend code.
            </p>
          </FadeIn>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <FadeIn className="qs-code-frame">
              <div className="qs-code-bar">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <span className="text-sm font-medium text-white/90">React</span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                  tsx
                </span>
              </div>
              <pre className="qs-code-body">
                <code>
                  <span className="qs-code-kw">import</span>
                  {` { ChatBot } `}
                  <span className="qs-code-kw">from</span>{" "}
                  <span className="qs-code-str">&quot;@quickstart-ai/widget-react&quot;</span>
                  <span className="qs-code-punct">;</span>
                  {"\n\n"}
                  <span className="qs-code-punct">&lt;</span>
                  <span className="qs-code-tag">ChatBot</span>
                  {"\n  "}
                  <span className="qs-code-attr">clientId</span>
                  <span className="qs-code-punct">=</span>
                  <span className="qs-code-str">&quot;qs_your_client_id&quot;</span>
                  {"\n  "}
                  <span className="qs-code-attr">apiUrl</span>
                  <span className="qs-code-punct">=</span>
                  <span className="qs-code-str">&quot;https://api.yourdomain.com&quot;</span>
                  {"\n"}
                  <span className="qs-code-punct">/&gt;</span>
                </code>
              </pre>
            </FadeIn>

            <FadeIn delay={0.08} className="qs-code-frame">
              <div className="qs-code-bar">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <span className="text-sm font-medium text-white/90">HTML / JS</span>
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
                  <span className="qs-code-attr">data-api-url</span>
                  <span className="qs-code-punct">=</span>
                  <span className="qs-code-str">&quot;https://api.yourdomain.com&quot;</span>
                  {"\n  "}
                  <span className="qs-code-attr">async</span>
                  {"\n"}
                  <span className="qs-code-punct">&gt;&lt;/</span>
                  <span className="qs-code-tag">script</span>
                  <span className="qs-code-punct">&gt;</span>
                </code>
              </pre>
            </FadeIn>
          </div>

          <FadeIn className="mt-8 flex justify-center sm:mt-10">
            <Link href="/docs/embed" className="qs-btn-primary w-full max-w-xs justify-center sm:w-auto sm:max-w-none">
              Read Documentation
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-ink/[0.08] bg-clay px-4 py-8 sm:px-6 sm:py-10 md:px-12 md:py-12">
        <FadeIn className="mx-auto flex max-w-4xl flex-col gap-5 rounded-2xl border border-ink/[0.08] bg-white px-5 py-7 sm:px-6 sm:py-8 md:flex-row md:items-center md:justify-between md:px-8 md:py-9">
          <div className="max-w-md min-w-0">
            <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl md:text-3xl">
              Put QuickStart on your site today
            </h2>
            <p className="mt-2 text-sm text-mute md:text-base">
              Create an account, add knowledge, embed the chatbot. Free to start.
            </p>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <Link
              href="/register"
              className="qs-btn-primary w-full justify-center !px-5 !py-2.5 text-sm sm:w-auto"
            >
              Create free account
            </Link>
            <Link
              href="/docs/embed"
              className="qs-btn-ghost w-full justify-center !px-5 !py-2.5 text-sm sm:w-auto"
            >
              Read Documentation
            </Link>
          </div>
        </FadeIn>
      </section>

      <LandingFooter />
    </main>
  );
}
