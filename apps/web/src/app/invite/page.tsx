"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, getStoredToken, setStoredToken } from "@/lib/api";
import { DashBtn, DashPanel } from "@/components/dashboard/DashboardShell";

type InvitePreview = {
  projectId: string;
  projectName: string;
  email: string;
  role: string;
  expired: boolean;
  inviterName: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-clay px-4 py-10">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

function InviteContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    if (!token || token.length !== 64) {
      setErr("Invalid invite link");
      return;
    }
    api<{ invite: InvitePreview }>(`/api/v1/invites/preview?token=${encodeURIComponent(token)}`)
      .then((res) => setPreview(res.invite))
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load invite"));
  }, [token]);

  useEffect(() => {
    const authToken = getStoredToken();
    if (!authToken) {
      setSessionEmail(null);
      setSessionChecked(true);
      return;
    }
    api<{ user: { email: string } }>("/api/v1/auth/me", { token: authToken })
      .then((res) => setSessionEmail(res.user.email))
      .catch(() => {
        setStoredToken(null);
        setSessionEmail(null);
      })
      .finally(() => setSessionChecked(true));
  }, []);

  const emailMismatch = useMemo(() => {
    if (!preview || !sessionEmail) return false;
    return normalizeEmail(sessionEmail) !== normalizeEmail(preview.email);
  }, [preview, sessionEmail]);

  async function accept() {
    if (!token) return;
    const authToken = getStoredToken();
    if (!authToken) {
      router.push(loginUrl(token, preview?.email));
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const res = await api<{ projectId: string }>("/api/v1/invites/accept", {
        method: "POST",
        body: JSON.stringify({ token }),
        token: authToken,
      });
      router.push(`/dashboard/projects/${res.projectId}/inbox`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not accept invite");
    } finally {
      setBusy(false);
    }
  }

  function switchAccount() {
    setStoredToken(null);
    router.push(loginUrl(token, preview?.email));
  }

  if (err && !preview) {
    return (
      <InviteShell>
        <DashPanel className="text-center">
          <p className="text-sm text-red-600">{err}</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm text-ink underline">
            Go to dashboard
          </Link>
        </DashPanel>
      </InviteShell>
    );
  }

  if (!preview || !sessionChecked) {
    return (
      <InviteShell>
        <div className="h-40 animate-pulse rounded-2xl bg-white/60" />
      </InviteShell>
    );
  }

  const loggedIn = Boolean(sessionEmail);
  const registerUrl = `/register?next=${encodeURIComponent(`/invite?token=${token}`)}&email=${encodeURIComponent(preview.email)}`;

  return (
    <InviteShell>
      <DashPanel className="text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">Team invite</p>
        <h1 className="mt-3 font-sans text-2xl font-bold text-ink">{preview.projectName}</h1>
        <p className="mt-3 text-sm text-mute">
          {preview.inviterName ? `${preview.inviterName} invited you` : "You were invited"} to join as{" "}
          <strong className="text-ink">{preview.role}</strong>.
        </p>
        <p className="mt-2 text-xs text-mute">Sent to {preview.email}</p>

        {loggedIn && (
          <p className="mt-3 text-xs text-mute">
            Signed in as <strong className="text-ink">{sessionEmail}</strong>
          </p>
        )}

        {preview.expired ? (
          <p className="mt-6 text-sm text-red-600">This invite has expired. Ask for a new one.</p>
        ) : emailMismatch ? (
          <div className="mt-6 space-y-3 text-left">
            <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-900">
              This invite is for <strong>{preview.email}</strong>, but you&apos;re signed in as{" "}
              <strong>{sessionEmail}</strong>. Sign out and log in with the invited email to accept.
            </p>
            <DashBtn type="button" className="w-full" onClick={switchAccount}>
              Sign out and switch account
            </DashBtn>
            <Link href="/dashboard" className="block text-center text-xs text-mute underline">
              Stay on current account
            </Link>
          </div>
        ) : loggedIn ? (
          <DashBtn type="button" className="mt-6 w-full" disabled={busy} onClick={() => void accept()}>
            Accept invitation
          </DashBtn>
        ) : (
          <div className="mt-6 flex flex-col gap-2">
            <Link href={loginUrl(token, preview.email)}>
              <DashBtn type="button" className="w-full">
                Log in to accept
              </DashBtn>
            </Link>
            <Link href={registerUrl}>
              <DashBtn type="button" variant="ghost" className="w-full">
                Create account with {preview.email}
              </DashBtn>
            </Link>
          </div>
        )}

        {err && !emailMismatch && <p className="mt-4 text-sm text-red-600">{err}</p>}
      </DashPanel>
    </InviteShell>
  );
}

function loginUrl(token: string, email?: string) {
  const next = encodeURIComponent(`/invite?token=${token}`);
  const base = `/login?next=${next}`;
  return email ? `${base}&email=${encodeURIComponent(email)}` : base;
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <InviteShell>
          <div className="h-40 animate-pulse rounded-2xl bg-white/60" />
        </InviteShell>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
