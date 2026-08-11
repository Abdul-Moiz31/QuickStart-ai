"use client";

import { ProjectOnboardingGate } from "@/components/dashboard/ProjectOnboardingGate";

export default function ProjectSectionLayout({ children }: { children: React.ReactNode }) {
  return <ProjectOnboardingGate>{children}</ProjectOnboardingGate>;
}
