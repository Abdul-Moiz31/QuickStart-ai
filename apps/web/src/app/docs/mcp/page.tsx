import Link from "next/link";
import { Plug } from "lucide-react";
import { MCP_TOOL_GROUPS } from "@quickstart-ai/shared";

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
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/60">
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

const TOOL_COUNT = MCP_TOOL_GROUPS.reduce((total, group) => total + group.tools.length, 0);

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
        <p className="qs-eyebrow">Documentation</p>
        <h1 className="mt-3 qs-section-title">
          MCP connection
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-mute sm:text-base md:text-lg">
          Connect ChatGPT to your QuickStart chatbot over{" "}
          <span className="font-medium text-ink">Model Context Protocol (MCP)</span>. Manage
          business details and FAQs, read visitor conversations, and check how the chatbot is
          performing without opening the dashboard.
        </p>

        <section className="mt-12">
          <h2 className="font-display text-xl font-bold tracking-tight text-ink md:text-2xl">
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
              <h2 className="font-display text-xl font-bold tracking-tight text-ink">
                Available MCP tools
              </h2>
              <p className="mt-1 text-sm text-mute">
                {TOOL_COUNT} tools · Scopes: mcp:tools, project:read, knowledge:write
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-8">
            {MCP_TOOL_GROUPS.map((group) => (
              <div key={group.id}>
                <h3 className="text-sm font-semibold tracking-tight text-ink">{group.label}</h3>
                <p className="mt-1 text-sm text-mute">{group.description}.</p>
                <ul className="mt-3 space-y-3">
                  {group.tools.map((tool) => (
                    <li
                      key={tool.name}
                      className="border-t border-ink/[0.08] pt-3 text-sm text-mute"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="font-mono text-[13px] text-ink">{tool.name}</code>
                        <span
                          className={
                            tool.access === "write"
                              ? "rounded-full bg-ink px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white"
                              : "rounded-full bg-clay px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-mute"
                          }
                        >
                          {tool.access}
                        </span>
                        {tool.minRole && (
                          <span className="text-[11px] text-mute">
                            needs {tool.minRole} role
                          </span>
                        )}
                      </div>
                      <p className="mt-1 leading-relaxed">{tool.summary}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
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
