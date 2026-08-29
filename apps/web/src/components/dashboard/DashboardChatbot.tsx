"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { resolvePublicApiUrl } from "@/lib/api";

const ChatBot = dynamic(
  () => import("@quickstart-ai/widget-react").then((m) => m.ChatBot),
  { ssr: false },
);

/** Live widget for the active dashboard project (uses project embed credentials). */
export function DashboardChatbot() {
  const { projects, currentProjectId, loading } = useDashboard();
  const [apiUrl, setApiUrl] = useState<string | null>(null);

  useEffect(() => {
    setApiUrl(resolvePublicApiUrl());
  }, []);

  const project =
    projects.find((p) => p.id === currentProjectId) ?? projects[0] ?? null;
  const clientId = project?.credentials[0]?.clientId;

  if (loading || !clientId || !apiUrl) return null;

  return (
    <ChatBot
      clientId={clientId}
      apiUrl={apiUrl}
      position={(project?.widgetPosition as "left" | "right") ?? "right"}
      theme={(project?.widgetTheme as "primary" | "secondary" | "tech" | "professional") ?? "primary"}
      primaryColor={project?.primaryColor ?? "#0A0A0A"}
    />
  );
}
