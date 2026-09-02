"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { DashBtn, DashPanel } from "@/components/dashboard/DashboardShell";

/** Soft-gates project tabs until onboarding is finished (owners only). */
export function ProjectOnboardingGate({ children }: { children: ReactNode }) {
  const { user, loading, openOnboarding, projects, currentProjectId } = useDashboard();
  const router = useRouter();

  const current = projects.find((p) => p.id === currentProjectId);
  const skipForInvitedMember = Boolean(current && !current.isOwner);

  if (loading) {
    return (
      <div className="px-6 py-10 md:px-10">
        <div className="h-40 animate-pulse rounded-2xl bg-clay" />
      </div>
    );
  }

  if (user && !user.onboardingCompleted && !skipForInvitedMember) {
    return (
      <div className="mx-auto max-w-lg px-6 py-12 md:px-10">
        <DashPanel className="text-center">
          <p className="qs-eyebrow">Onboarding required</p>
          <h1 className="mt-3 font-display text-2xl font-bold text-ink">
            Finish onboarding for this project first
          </h1>
          <p className="mt-3 text-sm text-mute">
            Knowledge, credentials, and the other project tabs unlock after you complete
            onboarding for your default project.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <DashBtn type="button" onClick={openOnboarding}>
              Continue onboarding
            </DashBtn>
            <DashBtn type="button" variant="ghost" onClick={() => router.push("/dashboard")}>
              Back to all projects
            </DashBtn>
          </div>
        </DashPanel>
      </div>
    );
  }

  return <>{children}</>;
}
