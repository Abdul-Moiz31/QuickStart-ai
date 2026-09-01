import Link from "next/link";
import { Check, Shield } from "lucide-react";

function CodeBlock({
  title,
  lang,
  children,
}: {
  title: string;
  lang: string;
  children: React.ReactNode;
}) {
  return (
    <div className="qs-code-frame mt-4">
      <div className="qs-code-bar">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-sm font-medium text-white/90">{title}</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-sky-300/70">
          {lang}
        </span>
      </div>
      <pre className="qs-code-body">
        <code>{children}</code>
      </pre>
    </div>
  );
}

const CHECKLIST = [
  "Allowlist your site origins on the project",
  "Never put client_secret in browser or public repos",
  "Rotate credentials if a key is ever exposed",
  "Widget only sends client_id — secrets stay on the server",
];

export default function EmbedDocsPage() {
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
              href="/"
              className="rounded-full px-3 py-2 text-mute transition hover:bg-clay hover:text-ink"
            >
              Home
            </Link>
            <Link
              href="/login"
              className="rounded-full px-3 py-2 text-mute transition hover:bg-clay hover:text-ink"
            >
              Sign in
            </Link>
            <Link href="/register" className="qs-btn-primary !px-4 !py-2 text-xs sm:!px-5 sm:text-sm">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-3xl min-w-0 px-4 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-10 md:px-8 md:pb-20 md:pt-12">
        <p className="qs-eyebrow">Documentation</p>
        <h1 className="mt-3 qs-section-title">
          Embed the chatbot
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-mute sm:text-base md:text-lg">
          Use your project{" "}
          <code className="rounded-md border border-ink/[0.08] bg-white px-1.5 py-0.5 font-mono text-[13px] text-ink">
            client_id
          </code>{" "}
          from the dashboard. Never put{" "}
          <code className="rounded-md border border-ink/[0.08] bg-white px-1.5 py-0.5 font-mono text-[13px] text-ink">
            client_secret
          </code>{" "}
          in browser code.
        </p>

        <section className="mt-12">
          <h2 className="font-display text-xl font-bold tracking-tight text-ink md:text-2xl">
            React
          </h2>
          <p className="mt-2 text-sm text-mute">
            Install the package, then drop in the component with your client ID.
          </p>
          <CodeBlock title="Install package" lang="bash">
            <span className="qs-code-kw">npm</span>
            {` install @quickstart-ai/widget-react`}
          </CodeBlock>
          <CodeBlock title="App.tsx" lang="tsx">
            <span className="qs-code-kw">import</span>
            {` { ChatBot } `}
            <span className="qs-code-kw">from</span>{" "}
            <span className="qs-code-str">&quot;@quickstart-ai/widget-react&quot;</span>
            <span className="qs-code-punct">;</span>
            {"\n\n"}
            <span className="qs-code-kw">export default function</span>
            {` App() {\n  `}
            <span className="qs-code-kw">return</span>
            {" (\n    "}
            <span className="qs-code-punct">&lt;</span>
            <span className="qs-code-tag">ChatBot</span>
            {"\n      "}
            <span className="qs-code-attr">clientId</span>
            <span className="qs-code-punct">=</span>
            <span className="qs-code-str">&quot;qs_your_client_id&quot;</span>
            {"\n      "}
            <span className="qs-code-attr">apiUrl</span>
            <span className="qs-code-punct">=</span>
            <span className="qs-code-str">&quot;https://api.yourdomain.com&quot;</span>
            {"\n    "}
            <span className="qs-code-punct">/&gt;</span>
            {"\n  );\n}"}
          </CodeBlock>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-xl font-bold tracking-tight text-ink md:text-2xl">
            HTML / JS
          </h2>
          <p className="mt-2 text-sm text-mute">
            Add one script tag to any page. No build step required.
          </p>
          <CodeBlock title="index.html" lang="html">
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
          </CodeBlock>
        </section>

        <section className="mt-12 rounded-2xl border border-ink/[0.08] bg-white p-6 md:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink/[0.1] bg-clay text-ink">
              <Shield className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-ink">
                Security checklist
              </h2>
              <p className="mt-1 text-sm text-mute">Keep your chatbot safe in production.</p>
            </div>
          </div>
          <ul className="mt-6 space-y-3">
            {CHECKLIST.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 border-t border-ink/[0.08] pt-3 text-sm text-mute"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-clay text-ink">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="qs-btn-primary">
            Open dashboard
          </Link>
          <Link href="/register" className="qs-btn-ghost">
            Create free account
          </Link>
        </div>
      </div>
    </main>
  );
}
