"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Check, Copy, X } from "lucide-react";
import Link from "next/link";
import { API_URL, api, getStoredToken } from "@/lib/api";
import { DashBtn, DashPanel } from "@/components/dashboard/DashboardShell";

type McpTab = "chatgpt" | "local";

function CopyField({
  label,
  value,
  fieldKey,
  copiedKey,
  onCopy,
}: {
  label: string;
  value: string;
  fieldKey: string;
  copiedKey: string | null;
  onCopy: (key: string, text: string) => void;
}) {
  return (
    <div className="rounded-xl border border-ink/[0.08] bg-clay/40 p-3.5">
      <p className="qs-micro-label">{label}</p>
      <div className="mt-1.5 flex items-start justify-between gap-2">
        <code className="min-w-0 flex-1 break-all font-mono text-sm text-ink">{value}</code>
        <button
          type="button"
          onClick={() => onCopy(fieldKey, value)}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-mute hover:bg-white hover:text-ink"
        >
          {copiedKey === fieldKey ? (
            <>
              <Check className="h-3.5 w-3.5" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function McpConnectionSection({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<McpTab>("chatgpt");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [mcpUrl, setMcpUrl] = useState(`${API_URL}/mcp`);

  const accessToken = getStoredToken() ?? "";
  const apiUrl = API_URL;

  const loadMcp = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const res = await api<{ mcp: { apiUrl: string } }>(`/api/v1/projects/${projectId}/mcp`, {
        token,
      });
      setMcpUrl(`${res.mcp.apiUrl.replace(/\/$/, "")}/mcp`);
    } catch {
      setMcpUrl(`${API_URL.replace(/\/$/, "")}/mcp`);
    }
  }, [projectId]);

  useEffect(() => {
    if (open) void loadMcp();
  }, [open, loadMcp]);

  function copy(key: string, text: string) {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  return (
    <>
      <DashPanel className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-lg text-sm text-mute">
          Connect ChatGPT with OAuth, or Cursor / Claude with a local MCP server and your access
          token.
        </p>
        <DashBtn type="button" onClick={() => setOpen(true)}>
          Connect
        </DashBtn>
      </DashPanel>

      <Transition show={open} as={Fragment}>
        <Dialog onClose={() => setOpen(false)} className="relative z-50">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-ink/40 backdrop-blur-[2px]" aria-hidden="true" />
          </TransitionChild>

          <div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:scale-95"
            >
              <DialogPanel className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-soft">
                <div className="flex items-start justify-between gap-3 border-b border-ink/[0.06] px-5 py-4">
                  <div>
                    <DialogTitle className="font-sans text-lg font-bold text-ink">
                      MCP connection
                    </DialogTitle>
                    <p className="mt-1 text-sm text-mute">
                      Manage business details and FAQs from ChatGPT or your IDE.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg p-2 text-mute hover:bg-clay hover:text-ink"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex gap-2 border-b border-ink/[0.06] px-5 pt-3">
                  {(
                    [
                      ["chatgpt", "ChatGPT (OAuth)"],
                      ["local", "Cursor / Claude"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTab(id)}
                      className={`rounded-t-lg px-3 py-2 text-sm font-medium transition ${
                        tab === id
                          ? "border border-b-white border-ink/10 bg-white text-ink"
                          : "text-mute hover:text-ink"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4 overflow-y-auto px-5 py-5">
                  {tab === "chatgpt" ? (
                    <>
                      <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-mute">
                        <li>In ChatGPT → Settings → Connectors, add a custom MCP server.</li>
                        <li>Paste the remote MCP URL below. OAuth is handled by our server.</li>
                        <li>Approve access when redirected — tools bind to this project.</li>
                      </ol>
                      <CopyField
                        label="Remote MCP URL"
                        value={mcpUrl}
                        fieldKey="mcp-url"
                        copiedKey={copiedKey}
                        onCopy={copy}
                      />
                      <p className="text-xs text-mute">
                        Need help? See the{" "}
                        <Link href="/docs/mcp" className="underline hover:text-ink">
                          MCP docs
                        </Link>
                        .
                      </p>
                    </>
                  ) : (
                    <>
                      <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-mute">
                        <li>Add the QuickStart MCP server in Cursor → Settings → MCP.</li>
                        <li>Paste the access token, API URL, and project ID into server env.</li>
                        <li>
                          Ask your assistant to save business details — e.g. &quot;Save my business
                          info to QuickStart.&quot;
                        </li>
                      </ol>
                      <div className="space-y-3">
                        <CopyField
                          label="Access token"
                          value={accessToken || "Please log in again"}
                          fieldKey="token"
                          copiedKey={copiedKey}
                          onCopy={copy}
                        />
                        <CopyField
                          label="API URL"
                          value={apiUrl}
                          fieldKey="api"
                          copiedKey={copiedKey}
                          onCopy={copy}
                        />
                        <CopyField
                          label="Project ID"
                          value={projectId}
                          fieldKey="project"
                          copiedKey={copiedKey}
                          onCopy={copy}
                        />
                      </div>
                      <p className="text-xs text-mute">
                        Run locally: <code className="font-mono">pnpm mcp</code>
                      </p>
                    </>
                  )}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
