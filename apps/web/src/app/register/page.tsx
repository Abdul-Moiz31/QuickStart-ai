"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, setStoredToken } from "@/lib/api";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const inviteEmail = searchParams.get("email") ?? "";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await api<{
        token: string;
        needsOnboarding?: boolean;
      }>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          password: fd.get("password"),
        }),
      });
      setStoredToken(res.token);
      const safeNext =
        nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : null;
      router.push(safeNext ?? "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const loginHref =
    nextPath && inviteEmail
      ? `/login?next=${encodeURIComponent(nextPath)}&email=${encodeURIComponent(inviteEmail)}`
      : nextPath
        ? `/login?next=${encodeURIComponent(nextPath)}`
        : "/login";

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      subtitle={
        nextPath?.startsWith("/invite")
          ? `Register with ${inviteEmail || "the invited email"} to join the team.`
          : "Set up your workspace in a minute, then configure your first project whenever you're ready."
      }
      footer={
        <>
          Already have an account?{" "}
          <Link href={loginHref} className="font-medium text-ink underline-offset-2 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink">Name</span>
          <input name="name" required autoComplete="name" placeholder="Your name" className="qs-field bg-clay/40" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={inviteEmail}
            readOnly={Boolean(inviteEmail)}
            placeholder="you@company.com"
            className="qs-field bg-clay/40"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink">Password</span>
          <PasswordInput
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="qs-btn-primary w-full">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
