"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, setStoredToken } from "@/lib/api";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await api<{ token: string }>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: fd.get("email"),
          password: fd.get("password"),
        }),
      });
      setStoredToken(res.token);
      const safeNext =
        nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : null;
      router.push(safeNext ?? "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      subtitle={
        nextPath?.startsWith("/oauth/")
          ? "Sign in to approve the ChatGPT MCP connection."
          : "Access your projects, knowledge base, and embed credentials."
      }
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-medium text-ink underline-offset-2 hover:underline">
            Create account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            className="qs-field bg-clay/40"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink">Password</span>
          <PasswordInput
            name="password"
            required
            autoComplete="current-password"
            placeholder="Your password"
          />
        </label>
        {error && (
          <p className="rounded-xl border border-ink/10 bg-clay px-3 py-2 text-sm text-ink">{error}</p>
        )}
        <button type="submit" disabled={loading} className="qs-btn-primary w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-clay" />}>
      <LoginForm />
    </Suspense>
  );
}
