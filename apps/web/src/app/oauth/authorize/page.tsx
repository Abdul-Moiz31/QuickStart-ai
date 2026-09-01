"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { API_URL, api, getStoredToken } from "@/lib/api";

function AuthorizeInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [approved, setApproved] = useState(false);

  const clientId = params.get("client_id") ?? "";
  const redirectUri = params.get("redirect_uri") ?? "";
  const codeChallenge = params.get("code_challenge") ?? "";
  const state = params.get("state") ?? "";
  const scope = params.get("scope") ?? "";
  const clientName = params.get("client_name") ?? "MCP Client";

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      const returnTo = `/oauth/authorize?${params.toString()}`;
      router.replace(`/login?next=${encodeURIComponent(returnTo)}`);
    }
  }, [params, router]);

  async function approve() {
    const token = getStoredToken();
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const projects = await api<{ projects: { id: string; name: string }[] }>(
        "/api/v1/projects",
        { token },
      );
      const projectId = projects.projects[0]?.id;
      if (!projectId) {
        setError("No project found. Complete onboarding first.");
        return;
      }

      const res = await api<{ success: boolean; redirectUrl?: string; message?: string }>(
        "/oauth/approve",
        {
          method: "POST",
          token,
          body: JSON.stringify({
            client_id: clientId,
            redirect_uri: redirectUri,
            code_challenge: codeChallenge,
            state: state || undefined,
            scope: scope || undefined,
            project_id: projectId,
          }),
        },
      );

      if (res.success && res.redirectUrl) {
        setApproved(true);
        window.location.href = res.redirectUrl;
        return;
      }
      setError(res.message ?? "Authorization failed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authorization failed");
    } finally {
      setBusy(false);
    }
  }

  function deny() {
    if (!redirectUri) {
      router.push("/dashboard");
      return;
    }
    const url = new URL(redirectUri);
    url.searchParams.set("error", "access_denied");
    if (state) url.searchParams.set("state", state);
    window.location.href = url.toString();
  }

  if (!clientId || !redirectUri || !codeChallenge) {
    return (
      <p className="text-sm text-mute">
        Invalid authorization request.{" "}
        <Link href="/dashboard" className="underline">
          Back to dashboard
        </Link>
      </p>
    );
  }

  return (
    <div className="qs-panel">
      <p className="qs-eyebrow">Authorize MCP</p>
      <h1 className="mt-2 qs-h1">{clientName}</h1>
      <p className="mt-3 text-sm leading-relaxed text-mute">
        This app wants to manage your QuickStart AI business profile and FAQs via MCP tools.
      </p>
      <ul className="mt-4 space-y-1 text-sm text-mute">
        <li>· Read and update business profile</li>
        <li>· List and add FAQ entries</li>
        <li>· List your projects</li>
      </ul>
      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy || approved}
          onClick={() => void approve()}
          className="qs-btn-primary !px-5 !py-2.5 text-sm disabled:opacity-60"
        >
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Approving…
            </span>
          ) : (
            "Approve"
          )}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={deny}
          className="qs-btn-ghost !px-5 !py-2.5 text-sm"
        >
          Deny
        </button>
      </div>
      <p className="mt-4 text-xs text-mute">API: {API_URL}</p>
    </div>
  );
}

export default function OAuthAuthorizePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-clay px-6 py-16">
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-mute" />
            </div>
          }
        >
          <AuthorizeInner />
        </Suspense>
      </div>
    </main>
  );
}
