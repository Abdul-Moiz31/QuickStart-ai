"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { api, getStoredToken } from "@/lib/api";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import {
  DashBtn,
  DashField,
  DashPanel,
  DashTextarea,
} from "@/components/dashboard/DashboardShell";

export default function DashboardHomePage() {
  const router = useRouter();
  const { user, projects, loading, refreshProjects, openOnboarding } = useDashboard();
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [secret, setSecret] = useState<{ clientId: string; clientSecret: string } | null>(null);

  function onNewProject() {
    if (user && !user.onboardingCompleted) {
      openOnboarding();
      return;
    }
    setModalOpen(true);
  }

  async function createProject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = getStoredToken();
    if (!token) return;
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    if (!name) return;
    setCreating(true);
    setError("");
    try {
      const res = await api<{
        project: { id: string };
        credentials: { clientId: string; clientSecret: string };
      }>("/api/v1/projects", {
        method: "POST",
        token,
        body: JSON.stringify({
          name,
          description: String(fd.get("description") || ""),
        }),
      });
      setSecret(res.credentials);
      setModalOpen(false);
      await refreshProjects();
      router.push(`/dashboard/projects/${res.project.id}/knowledge`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <header className="border-b border-ink/[0.08] px-6 py-8 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mute">
              Workspace
            </p>
            <h1 className="mt-2 font-sans text-3xl font-bold tracking-tight text-ink md:text-4xl">
              All projects
            </h1>
            <p className="mt-2 text-mute">
              {user ? `Welcome back, ${user.name}` : "Loading…"}
            </p>
          </div>
          <DashBtn type="button" onClick={onNewProject}>
            New project
          </DashBtn>
        </div>
      </header>

      <div className="px-6 py-8 md:px-10">
        {error && (
          <p className="mb-4 rounded-xl border border-ink/[0.08] bg-clay px-4 py-3 text-sm text-ink">
            {error}
          </p>
        )}
        {secret && (
          <div className="mb-6">
            <div className="qs-code-frame">
              <div className="qs-code-bar">
                <span className="text-sm text-white/90">Save credentials — shown once</span>
                <button
                  type="button"
                  className="text-xs text-white/50 hover:text-white"
                  onClick={() => setSecret(null)}
                >
                  Dismiss
                </button>
              </div>
              <pre className="qs-code-body text-[12px]">
                client_id: {secret.clientId}
                {"\n"}
                client_secret: {secret.clientSecret}
              </pre>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-clay" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <DashPanel className="py-14 text-center">
            <h2 className="font-sans text-2xl font-bold text-ink">No projects yet</h2>
            <p className="mx-auto mt-2 max-w-md text-mute">
              Finish onboarding or create a project to manage knowledge and embeds.
            </p>
            <DashBtn type="button" className="mt-6" onClick={onNewProject}>
              New project
            </DashBtn>
          </DashPanel>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/projects/${p.id}/knowledge`}
                className="rounded-2xl border border-ink/[0.08] bg-white p-6 shadow-soft transition hover:border-ink/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-sans text-lg font-bold text-ink">{p.name}</h2>
                  <span className="rounded-md bg-clay px-2 py-0.5 font-mono text-[10px] uppercase text-mute">
                    {p.plan}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-mute">
                  {p.description || "No description"}
                </p>
                <div className="mt-6 flex gap-4 border-t border-ink/[0.08] pt-4 text-xs text-mute">
                  <span>
                    <strong className="text-ink">{p._count?.documents ?? 0}</strong> docs
                  </span>
                  {p.isOwner && p.credits !== undefined && (
                    <span>
                      <strong className="text-ink">{p.credits}</strong> credits
                    </span>
                  )}
                  {!p.isOwner && p.memberRole && (
                    <span>
                      Role: <strong className="text-ink">{p.memberRole}</strong>
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.form
              onSubmit={createProject}
              className="w-full max-w-md rounded-2xl border border-ink/[0.08] bg-white p-6 shadow-soft"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
            >
              <h2 className="font-sans text-2xl font-bold text-ink">New project</h2>
              <label className="mt-5 block text-xs text-mute">Name</label>
              <DashField name="name" required autoFocus className="mt-1.5" placeholder="Support bot" />
              <label className="mt-4 block text-xs text-mute">Description</label>
              <DashTextarea name="description" rows={3} className="mt-1.5" />
              <div className="mt-6 flex justify-end gap-2">
                <DashBtn type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </DashBtn>
                <DashBtn type="submit" disabled={creating}>
                  {creating ? "Creating…" : "Create"}
                </DashBtn>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
