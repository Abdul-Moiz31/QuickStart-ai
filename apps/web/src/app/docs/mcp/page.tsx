import Link from "next/link";
import { Check, Plug } from "lucide-react";

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

const PRODUCTION_API_URL = "https://api.quickstart.ai";
const MCP_URL = `${PRODUCTION_API_URL}/mcp`;
const OAUTH_METADATA_URL = `${PRODUCTION_API_URL}/.well-known/oauth-authorization-server`;

const TOOLS = [
  "get_business_profile — read business name, industry, description, location, support email",
  "save_business_profile — update business details (syncs chatbot knowledge)",
  "list_faqs — list FAQ pairs used by the chatbot",
  "add_faq — add a new FAQ entry",
  "list_projects — list your QuickStart projects",
  "list_conversations — list recent visitor chat sessions",
  "get_conversation — read a full conversation with messages",
  "search_conversations — search chats by name, email, or message content",
];

export default function McpDocsPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-clay text-ink">
      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-4 sm:pt-4 md:px-6 md:pt-5">
        <div className="mx-auto flex max-w-3xl min-w-0 items-center justify-between gap-2 rounded-full border border-ink/[0.08] bg-white px-2.5 py-2 shadow-soft sm:gap-3 sm:px-4 sm:py-2.5">
          <Link
            href="/"
            className="shrink-0 pl-2 font-display text-sm font-bold tracking-tight text-ink sm:text-base"
          >
            QuickStart AI
          </Link>
          <nav className="flex items-center gap-1 text-sm sm:gap-2">
            <Link
              href="/docs/embed"
              className="rounded-full px-3 py-2 text-mute transition hover:bg-clay hover:text-ink"
            >
              Embed
            </Link>
            <Link href="/dashboard" className="qs-btn-primary !px-4 !py-2 text-xs sm:!px-5 sm:text-sm">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-3xl min-w-0 px-4 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-10 md:px-8 md:pb-20 md:pt-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-mute">Documentation</p>
        <h1 className="mt-3 font-sans text-2xl font-bold tracking-tight text-black sm:text-3xl md:text-4xl">
          MCP connection
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-mute sm:text-base md:text-lg">
          Connect ChatGPT to your QuickStart chatbot over{" "}
          <span className="font-medium text-ink">Model Context Protocol (MCP)</span>. Manage
          business details, FAQs, and visitor conversations without opening the dashboard.
        </p>

        <section className="mt-12">
          <h2 className="font-sans text-xl font-bold tracking-tight text-black md:text-2xl">
            Connect in ChatGPT
          </h2>
          <p className="mt-2 text-sm text-mute">
            QuickStart hosts a production MCP server with OAuth. ChatGPT connects over HTTPS — no
            local setup required.
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-mute">
            <li>Open your project in Dashboard → Settings → MCP connection.</li>
            <li>In ChatGPT → Settings → Connectors, add a custom MCP server.</li>
            <li>Paste the production MCP URL below and complete OAuth when prompted.</li>
          </ol>
          <CodeBlock title="Production MCP URL" lang="url">
            {MCP_URL}
          </CodeBlock>
          <CodeBlock title="OAuth metadata" lang="url">
            {OAUTH_METADATA_URL}
          </CodeBlock>
          <p className="mt-3 text-xs text-mute">
            After you approve access, MCP tools are scoped to your QuickStart project.
          </p>
        </section>

        <section className="mt-12 rounded-2xl border border-ink/[0.08] bg-white p-6 md:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink/[0.1] bg-clay text-ink">
              <Plug className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </div>
            <div>
              <h2 className="font-sans text-xl font-bold tracking-tight text-black">
                Available MCP tools
              </h2>
              <p className="mt-1 text-sm text-mute">Scopes: mcp:tools, project:read, knowledge:write</p>
            </div>
          </div>
          <ul className="mt-6 space-y-3">
            {TOOLS.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 border-t border-ink/[0.08] pt-3 text-sm text-mute"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-clay text-ink">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                </span>
                <code className="font-mono text-[13px] text-ink">{item}</code>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <Link href="/dashboard" className="qs-btn-primary w-full justify-center sm:w-auto">
            Open dashboard
          </Link>
          <Link href="/docs/embed" className="qs-btn-ghost w-full justify-center sm:w-auto">
            Embed docs
          </Link>
        </div>
      </div>
    </main>
  );
}
