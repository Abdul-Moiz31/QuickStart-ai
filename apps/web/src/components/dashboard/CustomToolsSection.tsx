"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { api, getStoredToken } from "@/lib/api";
import { DashBtn, DashField, DashPanel, DashTextarea } from "@/components/dashboard/DashboardShell";

const AUTH_MASK = "••••••••••••••••";

interface CustomToolParameter {
  name: string;
  description: string;
  required: boolean;
}

interface CustomToolRow {
  id: string;
  name: string;
  description: string;
  httpMethod: string;
  url: string;
  parameters: CustomToolParameter[];
  responseKey: string | null;
  enabled: boolean;
  hasAuthHeader: boolean;
}

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH"] as const;

function emptyParameter(): CustomToolParameter {
  return { name: "product_id", description: "The product ID the customer asked about", required: true };
}

export function CustomToolsSection({ projectId }: { projectId: string }) {
  const [tools, setTools] = useState<CustomToolRow[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testToolId, setTestToolId] = useState<string | null>(null);
  const [testArgs, setTestArgs] = useState('{\n  "product_id": "1"\n}');
  const [testResult, setTestResult] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [httpMethod, setHttpMethod] = useState<(typeof HTTP_METHODS)[number]>("POST");
  const [url, setUrl] = useState("");
  const [responseKey, setResponseKey] = useState("");
  const [authHeader, setAuthHeader] = useState("");
  const [authEditing, setAuthEditing] = useState(false);
  const [hasAuthHeader, setHasAuthHeader] = useState(false);
  const [parameters, setParameters] = useState<CustomToolParameter[]>([emptyParameter()]);

  const load = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const res = await api<{ tools: CustomToolRow[] }>(
        `/api/v1/projects/${projectId}/custom-tools`,
        { token },
      );
      setTools(Array.isArray(res.tools) ? res.tools : []);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not load custom tools");
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setName("");
    setDescription("");
    setHttpMethod("POST");
    setUrl("");
    setResponseKey("");
    setAuthHeader("");
    setAuthEditing(false);
    setHasAuthHeader(false);
    setParameters([emptyParameter()]);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(tool: CustomToolRow) {
    setEditingId(tool.id);
    setName(tool.name);
    setDescription(tool.description);
    setHttpMethod(tool.httpMethod as (typeof HTTP_METHODS)[number]);
    setUrl(tool.url);
    setResponseKey(tool.responseKey ?? "");
    setAuthHeader("");
    setAuthEditing(false);
    setHasAuthHeader(tool.hasAuthHeader);
    setParameters(tool.parameters.length ? tool.parameters : [emptyParameter()]);
    setShowForm(true);
  }

  async function saveTool(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken();
    if (!token) return;
    setBusy(true);
    setMsg("");
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim(),
        httpMethod,
        url: url.trim(),
        parameters,
        responseKey: responseKey.trim() || undefined,
      };
      if (authEditing && authHeader.trim()) {
        payload.authHeader = authHeader.trim();
      }
      if (editingId) {
        if (authEditing && !authHeader.trim() && !hasAuthHeader) {
          payload.authHeader = null;
        }
        await api(`/api/v1/projects/${projectId}/custom-tools/${editingId}`, {
          method: "PATCH",
          token,
          body: JSON.stringify(payload),
        });
        setMsg("Tool updated");
      } else {
        if (authHeader.trim()) payload.authHeader = authHeader.trim();
        await api(`/api/v1/projects/${projectId}/custom-tools`, {
          method: "POST",
          token,
          body: JSON.stringify(payload),
        });
        setMsg("Tool created");
      }
      resetForm();
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleEnabled(tool: CustomToolRow) {
    const token = getStoredToken();
    if (!token) return;
    await api(`/api/v1/projects/${projectId}/custom-tools/${tool.id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ enabled: !tool.enabled }),
    });
    await load();
  }

  async function removeTool(toolId: string) {
    if (!confirm("Delete this custom tool?")) return;
    const token = getStoredToken();
    if (!token) return;
    await api(`/api/v1/projects/${projectId}/custom-tools/${toolId}`, {
      method: "DELETE",
      token,
    });
    if (testToolId === toolId) setTestToolId(null);
    await load();
  }

  async function runTest(toolId: string) {
    const token = getStoredToken();
    if (!token) return;
    setBusy(true);
    setTestResult(null);
    try {
      let args: Record<string, unknown> = {};
      if (testArgs.trim()) {
        args = JSON.parse(testArgs) as Record<string, unknown>;
      }
      const res = await api<{
        statusCode: number | null;
        output: string;
        rawBody: string | null;
      }>(`/api/v1/projects/${projectId}/custom-tools/${toolId}/test`, {
        method: "POST",
        token,
        body: JSON.stringify({ args }),
      });
      setTestResult(
        `Status: ${res.statusCode ?? "n/a"}\nOutput: ${res.output}${
          res.rawBody ? `\n\nRaw:\n${res.rawBody}` : ""
        }`,
      );
    } catch (err) {
      setTestResult(err instanceof Error ? err.message : "Test failed");
    } finally {
      setBusy(false);
    }
  }

  const selectClass =
    "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40";

  return (
    <DashPanel>
      <div>
        <p className="font-medium text-ink">Custom tools</p>
        <p className="mt-1 text-sm text-mute">
          Connect your backend APIs so the bot can look up live data (order status, appointments,
          etc.). One-shot only — the bot can call one external lookup per message, not multi-step
          chains.
        </p>
      </div>

      {msg && <p className="mt-4 text-sm text-mute">{msg}</p>}

      <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-xs text-mute">{tools.length} tool{tools.length === 1 ? "" : "s"}</p>
            {!showForm && (
              <DashBtn type="button" variant="ghost" onClick={() => setShowForm(true)}>
                Add tool
              </DashBtn>
            )}
          </div>

          {showForm && (
            <form onSubmit={saveTool} className="mt-4 space-y-4 border-b border-ink/[0.06] pb-4">
              <div>
                <label className="text-sm font-medium text-ink">Name</label>
                <p className="mt-0.5 text-xs text-mute">snake_case — shown to the AI planner</p>
                <DashField
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="check_order_status"
                  disabled={Boolean(editingId)}
                  className="mt-1.5 font-mono"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink">Description</label>
                <p className="mt-0.5 text-xs text-mute">
                  When should the bot use this? The planner picks tools from this text alone.
                </p>
                <DashTextarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Look up order status when the customer provides an order number"
                  rows={2}
                  className="mt-1.5"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-ink">Method</label>
                  <select
                    value={httpMethod}
                    onChange={(e) =>
                      setHttpMethod(e.target.value as (typeof HTTP_METHODS)[number])
                    }
                    className={`${selectClass} mt-1.5`}
                  >
                    {HTTP_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink">Response key</label>
                  <p className="mt-0.5 text-xs text-mute">Optional JSON field to extract</p>
                  <DashField
                    value={responseKey}
                    onChange={(e) => setResponseKey(e.target.value)}
                    placeholder="status"
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-ink">URL</label>
                <p className="mt-0.5 text-xs text-mute">
                  HTTPS only. Use {"{param_name}"} for path IDs, e.g.{" "}
                  <span className="font-mono text-ink">https://dummyjson.com/products/{"{product_id}"}</span>
                </p>
                <DashField
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://dummyjson.com/products/{product_id}"
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink">Auth header</label>
                <p className="mt-0.5 text-xs text-mute">
                  Optional full Authorization value (e.g. Bearer your-token)
                </p>
                {hasAuthHeader && !authEditing ? (
                  <div className="mt-1.5 flex items-center gap-2">
                    <DashField value={AUTH_MASK} readOnly className="font-mono" />
                    <DashBtn type="button" variant="ghost" onClick={() => setAuthEditing(true)}>
                      Change
                    </DashBtn>
                  </div>
                ) : (
                  <DashField
                    value={authHeader}
                    onChange={(e) => setAuthHeader(e.target.value)}
                    placeholder="Bearer …"
                    className="mt-1.5 font-mono"
                  />
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-ink">Parameters</label>
                {parameters.map((p, i) => (
                  <div
                    key={i}
                    className="grid gap-2 rounded-xl border border-ink/[0.08] bg-clay/30 p-3 sm:grid-cols-2"
                  >
                    <DashField
                      value={p.name}
                      onChange={(e) =>
                        setParameters((ps) =>
                          ps.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)),
                        )
                      }
                      placeholder="param_name"
                      className="font-mono"
                    />
                    <DashField
                      value={p.description}
                      onChange={(e) =>
                        setParameters((ps) =>
                          ps.map((x, idx) =>
                            idx === i ? { ...x, description: e.target.value } : x,
                          ),
                        )
                      }
                      placeholder="What the bot should extract"
                    />
                    {parameters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setParameters((ps) => ps.filter((_, idx) => idx !== i))}
                        className="text-xs text-mute hover:text-red-600 sm:col-span-2 text-left"
                      >
                        Remove parameter
                      </button>
                    )}
                  </div>
                ))}
                {parameters.length < 10 && (
                  <DashBtn
                    type="button"
                    variant="ghost"
                    onClick={() => setParameters((ps) => [...ps, emptyParameter()])}
                  >
                    + Add parameter
                  </DashBtn>
                )}
              </div>
              <div className="flex gap-2">
                <DashBtn type="submit" disabled={busy}>
                  {busy ? "Saving…" : editingId ? "Save changes" : "Create tool"}
                </DashBtn>
                <DashBtn type="button" variant="ghost" onClick={resetForm}>
                  Cancel
                </DashBtn>
              </div>
            </form>
          )}

          {tools.length === 0 && !showForm ? (
            <p className="mt-4 text-sm text-mute">No custom tools yet.</p>
          ) : (
            <div className="mt-4 space-y-0">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  className="border-t border-ink/[0.06] py-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium text-ink">{tool.name}</p>
                      <p className="mt-0.5 text-sm text-mute">{tool.description}</p>
                      <p className="mt-1 truncate text-xs text-mute">
                        {tool.httpMethod} {tool.url}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={tool.enabled}
                        onClick={() => void toggleEnabled(tool)}
                        className={`relative h-6 w-11 rounded-full transition ${
                          tool.enabled ? "bg-ink" : "bg-ink/15"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                            tool.enabled ? "left-5" : "left-0.5"
                          }`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeTool(tool.id)}
                        className="rounded-lg border border-ink/10 p-2 text-mute hover:text-red-600"
                        aria-label="Delete tool"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <DashBtn type="button" variant="ghost" onClick={() => startEdit(tool)}>
                      Edit
                    </DashBtn>
                    <DashBtn
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setTestToolId(testToolId === tool.id ? null : tool.id);
                        setTestResult(null);
                      }}
                    >
                      {testToolId === tool.id ? "Hide test" : "Test"}
                    </DashBtn>
                  </div>
                  {testToolId === tool.id && (
                    <div className="mt-3 space-y-2 rounded-xl border border-ink/[0.08] bg-clay/30 p-3">
                      <label className="text-xs font-medium text-ink">Sample args (JSON)</label>
                      <DashTextarea
                        value={testArgs}
                        onChange={(e) => setTestArgs(e.target.value)}
                        rows={4}
                        className="font-mono text-xs"
                      />
                      <DashBtn
                        type="button"
                        disabled={busy}
                        onClick={() => void runTest(tool.id)}
                      >
                        {busy ? "Running…" : "Run test"}
                      </DashBtn>
                      {testResult && (
                        <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-xs text-ink">
                          {testResult}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
    </DashPanel>
  );
}
