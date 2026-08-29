"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, getStoredToken, setStoredToken } from "@/lib/api";

export type DashProject = {
  id: string;
  name: string;
  description: string;
  credits: number;
  plan: string;
  primaryColor?: string;
  welcomeMessage?: string;
  widgetTheme?: string;
  widgetPosition?: string;
  toolsWebSearch?: boolean;
  chatbotEnabled?: boolean;
  evalPassedAt?: string | null;
  credentials: { clientId: string; label: string }[];
  _count: { documents: number };
};

type DashUser = {
  id: string;
  name: string;
  email: string;
  onboardingCompleted: boolean;
  businessName?: string | null;
};

type Ctx = {
  user: DashUser | null;
  projects: DashProject[];
  loading: boolean;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  refreshProjects: () => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
  currentProjectId: string | null;
  onboardingOpen: boolean;
  openOnboarding: () => void;
  dismissOnboarding: () => void;
  markOnboardingComplete: () => Promise<void>;
};

const DISMISS_KEY = "qs-onboarding-dismissed";

const DashboardContext = createContext<Ctx | null>(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard requires DashboardProvider");
  return ctx;
}

function dismissStorageKey(userId: string) {
  return `${DISMISS_KEY}:${userId}`;
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<DashUser | null>(null);
  const [projects, setProjects] = useState<DashProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const currentProjectId = useMemo(() => {
    const m = pathname?.match(/\/dashboard\/projects\/([^/]+)/);
    return m?.[1] ?? null;
  }, [pathname]);

  const refreshProjects = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    const list = await api<{ projects: DashProject[] }>("/api/v1/projects", { token });
    setProjects(list.projects);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    const me = await api<{ user: DashUser }>("/api/v1/auth/me", { token });
    setUser(me.user);
  }, []);

  const openOnboarding = useCallback(() => {
    setOnboardingOpen(true);
  }, []);

  const dismissOnboarding = useCallback(() => {
    setOnboardingOpen(false);
    if (user?.id) {
      try {
        sessionStorage.setItem(dismissStorageKey(user.id), "1");
      } catch {
        /* ignore */
      }
    }
  }, [user?.id]);

  const markOnboardingComplete = useCallback(async () => {
    setUser((u) => (u ? { ...u, onboardingCompleted: true } : u));
    setOnboardingOpen(false);
    if (user?.id) {
      try {
        sessionStorage.removeItem(dismissStorageKey(user.id));
      } catch {
        /* ignore */
      }
    }
    await refreshProjects();
    await refreshUser();
  }, [user?.id, refreshProjects, refreshUser]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        const me = await api<{ user: DashUser }>("/api/v1/auth/me", { token });
        setUser(me.user);
        await refreshProjects();

        if (!me.user.onboardingCompleted) {
          let dismissed = false;
          try {
            dismissed = sessionStorage.getItem(dismissStorageKey(me.user.id)) === "1";
          } catch {
            dismissed = false;
          }
          if (!dismissed) setOnboardingOpen(true);
        }
      } catch {
        setStoredToken(null);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router, refreshProjects]);

  function logout() {
    setStoredToken(null);
    router.push("/");
  }

  const value = useMemo(
    () => ({
      user,
      projects,
      loading,
      collapsed,
      setCollapsed,
      refreshProjects,
      refreshUser,
      logout,
      currentProjectId,
      onboardingOpen,
      openOnboarding,
      dismissOnboarding,
      markOnboardingComplete,
    }),
    [
      user,
      projects,
      loading,
      collapsed,
      refreshProjects,
      refreshUser,
      currentProjectId,
      onboardingOpen,
      openOnboarding,
      dismissOnboarding,
      markOnboardingComplete,
    ],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}
