"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api, getStoredToken } from "@/lib/api";
import { DashBtn, DashField, DashPanel } from "@/components/dashboard/DashboardShell";
import { McpConnectionSection } from "@/components/dashboard/McpConnectionSection";
import {
  LLM_PROVIDER_OPTIONS,
  getDefaultModelId,
  getProviderModels,
  getProviderOption,
  resolveModelId,
} from "@quickstart-ai/shared";

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 border-t border-ink/[0.08] pt-10 first:mt-8 first:border-t-0 first:pt-0">
      <h2 className="font-sans text-lg font-bold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-mute">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const SAVED_KEY_MASK = "••••••••••••••••";

export default function SettingsPage() {
  const { id } = useParams<{ id: string }>();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const [creds, setCreds] = useState<{ id: string; clientId: string; label: string }[]>([]);
  const [llmProvider, setLlmProvider] = useState("openrouter");
  const [useOwnLlmKey, setUseOwnLlmKey] = useState(false);
  const [llmLoaded, setLlmLoaded] = useState(false);
  const [llmModel, setLlmModel] = useState("");
  const [llmApiKey, setLlmApiKey] = useState("");
  const [llmKeyEditing, setLlmKeyEditing] = useState(false);
  const [llmKeyMasked, setLlmKeyMasked] = useState<string | null>(null);
  const [hasLlmKey, setHasLlmKey] = useState(false);
  const [allowAnonymousSessions, setAllowAnonymousSessions] = useState(false);
  const [visitorAccessLoaded, setVisitorAccessLoaded] = useState(false);

  const byokProviders = useMemo(
    () => LLM_PROVIDER_OPTIONS.filter((p) => p.id !== "platform"),
    [],
  );
  const modelOptions = useMemo(() => getProviderModels(llmProvider), [llmProvider]);
  const providerOption = useMemo(() => getProviderOption(llmProvider), [llmProvider]);

  const load = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    const res = await api<{
      credentials: typeof creds;
      project: { allowAnonymousSessions?: boolean };
      llm: {
        llmProvider: string;
        useOwnLlmKey: boolean;
        llmModel: string | null;
        llmModelLabel: string | null;
        hasLlmKey: boolean;
        llmKeyMasked: string | null;
      };
    }>(`/api/v1/projects/${id}`, { token });

    setCreds(res.credentials);
    setAllowAnonymousSessions(Boolean(res.project?.allowAnonymousSessions));
    setVisitorAccessLoaded(true);
    const provider = res.llm.useOwnLlmKey ? res.llm.llmProvider : "openrouter";
    setLlmProvider(provider === "platform" ? "openrouter" : provider);
    setUseOwnLlmKey(res.llm.useOwnLlmKey);
    setLlmModel(resolveModelId(provider, res.llm.llmModel));
    setHasLlmKey(res.llm.hasLlmKey);
    setLlmKeyMasked(res.llm.llmKeyMasked);
    setLlmApiKey("");
    setLlmKeyEditing(false);
    setLlmLoaded(true);
  }, [id]);

  useEffect(() => {
    load().catch((e) => setMsg(e instanceof Error ? e.message : "Failed to load"));
  }, [load]);

  function onProviderChange(next: string) {
    setLlmProvider(next);
    setLlmModel(getDefaultModelId(next));
  }

  async function rotateCredentials() {
    const token = getStoredToken();
    if (!token) return;
    if (!confirm("Rotate credentials? Old client_id will stop working.")) return;
    setBusy(true);
    try {
      const res = await api<{ credentials: { clientId: string; clientSecret: string } }>(
        `/api/v1/projects/${id}/credentials/rotate`,
        { method: "POST", token },
      );
      setMsg(`New secret (save now): ${res.credentials.clientId} / ${res.credentials.clientSecret}`);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Rotate failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveVisitorAccess(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken();
    if (!token) return;
    setBusy(true);
    setMsg("");
    try {
      await api(`/api/v1/projects/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ allowAnonymousSessions }),
      });
      setMsg("Visitor access settings saved.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveLlm(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken();
    if (!token) return;
    setBusy(true);
    setMsg("");
    try {
      const body: Record<string, unknown> = {
        llmProvider: useOwnLlmKey ? llmProvider : "platform",
        useOwnLlmKey,
        llmModel: useOwnLlmKey ? llmModel : undefined,
      };
      if (llmApiKey.trim()) body.llmApiKey = llmApiKey.trim();

      await api(`/api/v1/projects/${id}/llm`, {
        method: "PATCH",
        token,
        body: JSON.stringify(body),
      });
      setMsg("LLM settings saved.");
      setLlmApiKey("");
      setLlmKeyEditing(false);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const showingSavedKey = hasLlmKey && !llmKeyEditing;

  const selectClass =
    "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40";

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
      <h1 className="font-sans text-2xl font-bold text-ink md:text-3xl">Settings</h1>
      <p className="mt-2 text-sm text-mute">
        Project credentials, AI configuration, and MCP connections for ChatGPT / Claude.
      </p>

      {msg && (
        <p className="mt-4 rounded-xl border border-ink/[0.08] bg-clay px-4 py-3 text-sm text-ink">
          {msg}
        </p>
      )}

      <SettingsSection
        title="Embed credentials"
        description="Use client_id in your widget. Keep client_secret on your server only."
      >
        <DashPanel className="space-y-3">
          {creds.map((c) => (
            <div key={c.id} className="rounded-xl border border-ink/[0.08] bg-clay/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <code className="font-mono text-sm text-ink">{c.clientId}</code>
                <button
                  type="button"
                  className="text-xs text-mute hover:text-ink"
                  onClick={() => {
                    void navigator.clipboard.writeText(c.clientId);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  }}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-1 text-xs text-mute">label: {c.label}</p>
            </div>
          ))}
          <DashBtn type="button" variant="ghost" disabled={busy} onClick={rotateCredentials}>
            Rotate credentials
          </DashBtn>
        </DashPanel>
      </SettingsSection>

      <SettingsSection
        title="Bring your own key"
        description="Optional — connect your LLM provider for better rate limits. We pick a cost-effective model for you."
      >
        <form onSubmit={saveLlm}>
          <DashPanel className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-ink">Use my own API key</p>
                <p className="mt-1 text-sm text-mute">
                  {useOwnLlmKey
                    ? "Your provider and model will be used for chat."
                    : "Using platform AI — toggle on to bring your own key."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={useOwnLlmKey}
                disabled={!llmLoaded}
                onClick={() => setUseOwnLlmKey((v) => !v)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  useOwnLlmKey ? "bg-black" : "bg-ink/15"
                } ${!llmLoaded ? "opacity-50" : ""}`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${
                    useOwnLlmKey ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            {useOwnLlmKey && (
              <>
                <div>
                  <label className="block text-xs text-mute">Provider</label>
                  <select
                    value={llmProvider}
                    onChange={(e) => onProviderChange(e.target.value)}
                    className={`mt-1.5 ${selectClass}`}
                  >
                    {byokProviders.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-mute">Model</label>
                  <select
                    value={llmModel}
                    onChange={(e) => setLlmModel(e.target.value)}
                    className={`mt-1.5 ${selectClass}`}
                  >
                    {modelOptions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                        {m.recommended ? " (recommended)" : ""}
                      </option>
                    ))}
                  </select>
                  {modelOptions.find((m) => m.id === llmModel)?.description && (
                    <p className="mt-1.5 text-xs text-mute">
                      {modelOptions.find((m) => m.id === llmModel)?.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-mute">
                    {providerOption?.keyLabel ?? "API key"}
                  </label>
                  <DashField
                    type="password"
                    value={showingSavedKey ? SAVED_KEY_MASK : llmApiKey}
                    readOnly={showingSavedKey}
                    onFocus={() => {
                      if (hasLlmKey && !llmKeyEditing) {
                        setLlmKeyEditing(true);
                        setLlmApiKey("");
                      }
                    }}
                    onChange={(e) => setLlmApiKey(e.target.value)}
                    onBlur={() => {
                      if (!llmApiKey.trim()) setLlmKeyEditing(false);
                    }}
                    placeholder={showingSavedKey ? undefined : providerOption?.keyHint || "Paste API key"}
                    autoComplete="off"
                    className="mt-1.5 font-mono"
                  />
                  {hasLlmKey && (
                    <p className="mt-1.5 text-xs text-mute">
                      {showingSavedKey
                        ? "API key saved — focus the field to replace it."
                        : "Leave blank when saving to keep your current key."}
                      {llmKeyMasked && showingSavedKey && (
                        <>
                          {" "}
                          (<span className="font-mono">{llmKeyMasked}</span>)
                        </>
                      )}
                    </p>
                  )}
                </div>
              </>
            )}

            <DashBtn type="submit" disabled={busy || !llmLoaded} className="!px-4 !py-2 text-sm">
              {busy ? "Saving…" : "Save LLM settings"}
            </DashBtn>
          </DashPanel>
        </form>
      </SettingsSection>

      <SettingsSection
        title="Visitor access"
        description="Control whether visitors must share their name and email before chatting."
      >
        <form onSubmit={saveVisitorAccess}>
          <DashPanel className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-ink">Allow anonymous chat</p>
                <p className="mt-1 text-sm text-mute">
                  When on, visitors can message immediately without a lead form. A session is
                  created on their first message. Use{" "}
                  <a
                    href={`/dashboard/projects/${id}/tools`}
                    className="font-medium text-ink underline underline-offset-2"
                  >
                    Lead capture
                  </a>{" "}
                  in Tools if the bot should collect contact details during the conversation.
                </p>
                <p className="mt-2 text-xs text-mute">
                  Client rate limits still apply. Anonymous sessions appear in the inbox with an
                  Anonymous badge.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={allowAnonymousSessions}
                disabled={!visitorAccessLoaded}
                onClick={() => setAllowAnonymousSessions((v) => !v)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  allowAnonymousSessions ? "bg-black" : "bg-ink/15"
                } ${!visitorAccessLoaded ? "opacity-50" : ""}`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${
                    allowAnonymousSessions ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
            <DashBtn type="submit" disabled={busy || !visitorAccessLoaded} className="!px-4 !py-2 text-sm">
              {busy ? "Saving…" : "Save visitor access"}
            </DashBtn>
          </DashPanel>
        </form>
      </SettingsSection>

      <SettingsSection
        title="MCP connection"
        description="Link ChatGPT, Claude, or Cursor to update your chatbot from any LLM."
      >
        <McpConnectionSection projectId={id} />
      </SettingsSection>
    </div>
  );
}
