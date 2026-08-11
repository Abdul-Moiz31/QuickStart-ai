"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/components/dashboard/DashboardContext";

/** Legacy route — onboarding now runs as a dashboard modal. */
export default function OnboardingRedirectPage() {
  const router = useRouter();
  const { openOnboarding, user, loading } = useDashboard();

  useEffect(() => {
    if (loading) return;
    if (user && !user.onboardingCompleted) openOnboarding();
    router.replace("/dashboard");
  }, [loading, user, openOnboarding, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-mute">
      Opening dashboard…
    </div>
  );
}
