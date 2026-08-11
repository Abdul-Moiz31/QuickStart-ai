"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coins,
  FileText,
  FlaskConical,
  FolderKanban,
  LogOut,
  MessageSquare,
  Palette,
  Puzzle,
  Settings2,
  Sparkles,
} from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { OnboardingModal } from "@/components/dashboard/OnboardingModal";
import { DashboardChatbot } from "@/components/dashboard/DashboardChatbot";

export function DashboardShell({ children }: { children: ReactNode }) {
  const {
    user,
    projects,
    loading,
    collapsed,
    setCollapsed,
    logout,
    currentProjectId,
    openOnboarding,
  } = useDashboard();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const current = projects.find((p) => p.id === currentProjectId) ?? projects[0] ?? null;
  const activeId = currentProjectId ?? current?.id ?? null;
  const needsOnboarding = Boolean(user && !user.onboardingCompleted);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const width = collapsed ? "w-[72px]" : "w-[260px]";
  const pl = collapsed ? "md:pl-[72px]" : "md:pl-[260px]";

  function navTo(section: string) {
    if (!activeId) {
      router.push("/dashboard");
      return;
    }
    router.push(`/dashboard/projects/${activeId}/${section}`);
  }

  function isSection(section: string) {
    return Boolean(pathname?.includes(`/projects/`) && pathname?.endsWith(`/${section}`));
  }

  const projectNav = [
    { id: "knowledge", label: "Knowledge", icon: FileText },
    { id: "conversations", label: "Conversations", icon: MessageSquare },
    { id: "eval", label: "Eval", icon: FlaskConical },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "settings", label: "Settings", icon: Settings2 },
    { id: "tools", label: "Tools", icon: Puzzle },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "custom-events", label: "Custom events", icon: Sparkles },
  ] as const;

  return (
    <div className="min-h-screen bg-white text-ink">
      <OnboardingModal />
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-ink/[0.08] bg-clay transition-[width] duration-200 md:flex ${width}`}
      >
        <div className="flex items-center justify-between border-b border-ink/[0.08] px-3 py-4">
          {!collapsed && (
            <Link
              href="/"
              className="truncate pl-1 font-display text-sm font-bold tracking-tight text-ink"
            >
              QuickStart AI
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-2 text-mute transition hover:bg-white hover:text-ink"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className="border-b border-ink/[0.08] p-2" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-white ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <Settings2 className="h-4 w-4 shrink-0 text-mute" strokeWidth={1.75} />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                  {current?.name ?? (loading ? "Loading…" : "Select project")}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-mute" />
              </>
            )}
          </button>
          {menuOpen && !collapsed && (
            <div className="mt-1 max-h-56 overflow-auto rounded-xl border border-ink/[0.08] bg-white p-1 shadow-soft">
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push(`/dashboard/projects/${p.id}/knowledge`);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition ${
                    p.id === activeId
                      ? "bg-black text-white"
                      : "text-mute hover:bg-clay hover:text-ink"
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  <span className="ml-2 font-mono text-[10px] opacity-60">{p.credits}</span>
                </button>
              ))}
              {projects.length === 0 && (
                <p className="px-2.5 py-2 text-xs text-mute">No projects yet</p>
              )}
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 text-sm">
          <Link
            href="/dashboard"
            className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 font-medium transition ${
              pathname === "/dashboard"
                ? "bg-black text-white"
                : "text-mute hover:bg-white hover:text-ink"
            } ${collapsed ? "justify-center" : ""}`}
            title="All projects"
          >
            <FolderKanban className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {!collapsed && <span>All projects</span>}
          </Link>

          {activeId && (
            <>
              {!collapsed && (
                <p className="mb-1 mt-4 px-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
                  Project
                </p>
              )}
              {projectNav.map((item) => {
                const Icon = item.icon;
                const active = isSection(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navTo(item.id)}
                    title={item.label}
                    className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left font-medium transition ${
                      active
                        ? "bg-black text-white"
                        : "text-mute hover:bg-white hover:text-ink"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </>
          )}

          <Link
            href="/docs/embed"
            className={`mt-auto flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 font-medium text-mute transition hover:bg-white hover:text-ink ${
              collapsed ? "justify-center" : ""
            }`}
            title="Documentation"
          >
            <BookOpen className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {!collapsed && <span>Documentation</span>}
          </Link>
        </nav>

        <div className="border-t border-ink/[0.08] p-3">
          {current && !collapsed && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-ink/[0.08] bg-white px-3 py-2.5">
              <Coins className="h-4 w-4 text-mute" strokeWidth={1.75} />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wide text-mute">Credits</p>
                <p className="font-mono text-sm font-medium text-ink">{current.credits}</p>
              </div>
            </div>
          )}
          {collapsed && current && (
            <div className="mb-2 flex justify-center" title={`${current.credits} credits`}>
              <Coins className="h-4 w-4 text-mute" />
            </div>
          )}
          {!collapsed && user && (
            <p className="mb-2 truncate px-1 text-xs text-mute" title={user.email}>
              {user.email}
            </p>
          )}
          <button
            type="button"
            onClick={logout}
            className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-mute transition hover:bg-white hover:text-ink ${
              collapsed ? "justify-center" : ""
            }`}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/[0.08] bg-white px-4 py-3 md:hidden">
        <Link href="/dashboard" className="font-display text-sm font-bold text-ink">
          QuickStart AI
        </Link>
        <button type="button" onClick={logout} className="text-sm text-mute">
          Sign out
        </button>
      </div>

      <div className={pl}>
        {needsOnboarding && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[0.08] bg-clay px-6 py-3 md:px-10">
            <p className="text-sm text-ink">
              Finish onboarding for your default project to unlock Knowledge and more.
            </p>
            <DashBtn type="button" onClick={openOnboarding} className="!px-4 !py-2 text-xs">
              Continue onboarding
            </DashBtn>
          </div>
        )}
        {children}
      </div>
      <DashboardChatbot />
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const s = status.toUpperCase();
  const tone =
    s === "READY"
      ? "bg-black text-white"
      : s === "FAILED"
        ? "border border-ink/20 text-ink"
        : "bg-ink/10 text-mute";
  return (
    <span
      className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide ${tone}`}
    >
      {s}
    </span>
  );
}

export function DashPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-ink/[0.08] bg-white p-6 shadow-soft ${className}`}>
      {children}
    </div>
  );
}

export function DashField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-mute focus:border-ink/40 ${props.className ?? ""}`}
    />
  );
}

export function DashTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-mute focus:border-ink/40 ${props.className ?? ""}`}
    />
  );
}

export function DashBtn({
  children,
  variant = "primary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  const styles =
    variant === "primary"
      ? "bg-ink text-porcelain hover:bg-inkHover"
      : "border border-ink/15 text-ink hover:bg-ink/[0.03]";
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}
