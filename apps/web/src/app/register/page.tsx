"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setStoredToken } from "@/lib/api";
import { AuthShell } from "@/components/auth/AuthShell";

export default function RegisterPage() {
  const router = useRouter();
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
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Create an account, then set up your default project when you're ready."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-ink underline-offset-2 hover:underline">
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
            placeholder="you@company.com"
            className="qs-field bg-clay/40"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="qs-field bg-clay/40"
          />
        </label>
        {error && (
          <p className="rounded-xl border border-ink/10 bg-clay px-3 py-2 text-sm text-ink">{error}</p>
        )}
        <button type="submit" disabled={loading} className="qs-btn-primary w-full">
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
