import Link from "next/link";
import {
  Code2,
  FileText,
  Gift,
  Globe,
  KeyRound,
  MessagesSquare,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/FadeIn";
import { ScrollHowItWorks } from "@/components/motion/ScrollHowItWorks";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingMcpSection } from "@/components/landing/LandingMcpSection";
import { LandingNotificationsSection } from "@/components/landing/LandingNotificationsSection";

const BENEFITS: {
  title: string;
  body: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Put it on your site",
    body: "One line of code. The chat appears on your pages.",
    icon: Code2,
  },
  {
    title: "Use your own answers",
    body: "Add your FAQs and docs. It replies from that.",
    icon: FileText,
  },
  {
    title: "Help people anytime",
    body: "Visitors get answers even when you’re offline.",
    icon: MessagesSquare,
  },
];

const FEATURES: {
  title: string;
  body: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Trained on your docs",
    body: "Upload FAQs, pricing, and policies. The chatbot answers from your content — not random guesses.",
    icon: FileText,
  },
  {
    title: "Totally free to start",
    body: "Create a chatbot, add knowledge, and embed it at no cost. No credit card to get going.",
    icon: Gift,
  },
  {
    title: "Bring your own key",
    body: "Use your own AI API key. You stay in control of usage and billing with your provider.",
    icon: KeyRound,
  },
  {
    title: "Secure by design",
    body: "Public client ID for the widget. Your secret stays on the server — never in the browser.",
    icon: Shield,
  },
  {
    title: "Works on any website",
    body: "React apps or plain HTML. Same chatbot everywhere your customers already visit.",
    icon: Globe,
  },
  {
    title: "See every conversation",
    body: "Review chats from the dashboard so you know what visitors ask and improve your answers.",
    icon: MessagesSquare,
  },
];

export default function HomePage() {
  return (
    <main className="overflow-x-hidden bg-clay text-ink">
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
          </nav>
        </div>
      </header>

      <LandingHero />

      {/* What is QuickStart AI */}
      <section className="border-t border-ink/[0.08] bg-white px-4 py-12 sm:px-6 sm:py-16 md:px-12 md:py-20">
        <div className="mx-auto max-w-3xl min-w-0 text-center">
          <FadeIn>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-mute">
              What is QuickStart AI?
            </p>
            <h2 className="mt-4 font-sans text-2xl font-bold tracking-tight text-black sm:text-3xl md:text-4xl">
              It’s a chatbot for your website.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-mute sm:mt-5 sm:text-base md:text-lg">
              Visitors ask questions on your site. QuickStart answers using your FAQs and docs.
              You add it with one line of code.
            </p>
          </FadeIn>
        </div>

        <Stagger
          className="mx-auto mt-12 grid max-w-5xl gap-0 border-t border-ink/[0.08] text-left md:grid-cols-3"
          delay={0.05}
        >
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <StaggerItem
                key={b.title}
                className="border-b border-ink/[0.08] py-8 md:border-b-0 md:border-r md:px-8 md:py-10 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink/[0.1] bg-clay text-ink">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-sans text-lg font-bold text-ink">{b.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-mute">{b.body}</p>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>

        <FadeIn className="mt-8 flex justify-center sm:mt-10">
          <a href="#install" className="qs-btn-primary w-full max-w-xs justify-center sm:w-auto sm:max-w-none">
            Make it live
          </a>
        </FadeIn>
      </section>

      <ScrollHowItWorks />

      {/* Features */}
      <section className="border-t border-ink/[0.08] bg-white px-4 py-12 sm:px-6 sm:py-16 md:px-12 md:py-20">
        <div className="mx-auto max-w-6xl min-w-0">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-mute">Features</p>
            <h2 className="mt-3 font-sans text-2xl font-bold tracking-tight text-black sm:text-3xl md:text-4xl">
              What you get with QuickStart AI
            </h2>
            <p className="mt-3 text-sm text-mute sm:text-base md:text-lg">
              Real product features — clear, useful, and built for your website chatbot.
            </p>
          </FadeIn>
          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" delay={0.04}>
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <StaggerItem
                  key={f.title}
                  className="rounded-2xl border border-ink/[0.08] bg-clay p-6 md:p-7"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink/[0.1] bg-white text-ink">
                      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                    </div>
                    <div>
                      <h3 className="font-sans text-base font-bold text-black">{f.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-mute">{f.body}</p>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      <LandingNotificationsSection />

      <LandingMcpSection />

      {/* Install */}
      <section
        id="install"
        className="scroll-mt-20 border-t border-ink/[0.08] bg-clay px-4 py-12 sm:px-6 sm:py-14 md:px-12 md:py-16 lg:scroll-mt-24"
      >
        <div className="mx-auto max-w-6xl min-w-0">
          <FadeIn>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-mute">Install</p>
            <h2 className="mt-3 font-sans text-2xl font-bold tracking-tight text-black sm:text-3xl md:text-4xl">
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
                <span className="font-mono text-[10px] uppercase tracking-wider text-sky-300/70">
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
                <span className="font-mono text-[10px] uppercase tracking-wider text-sky-300/70">
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
            <h2 className="font-sans text-xl font-bold tracking-tight text-black sm:text-2xl md:text-3xl">
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

      <footer className="border-t border-ink/[0.08] bg-white px-4 py-10 text-sm text-mute sm:px-6 sm:py-12 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-base font-semibold text-ink">QuickStart AI</p>
            <p className="mt-2 max-w-xs text-sm">
              An AI chatbot for your website — one line of code.
            </p>
          </div>
          <div className="flex flex-wrap gap-10">
            <div className="space-y-2">
              <p className="font-medium text-ink">Product</p>
              <Link href="/register" className="block hover:text-ink">
                Get started
              </Link>
              <Link href="/docs/embed" className="block hover:text-ink">
                Documentation
              </Link>
              <Link href="/login" className="block hover:text-ink">
                Sign in
              </Link>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-6xl border-t border-ink/[0.08] pt-6">
          © {new Date().getFullYear()} QuickStart AI
        </div>
      </footer>
    </main>
  );
}
