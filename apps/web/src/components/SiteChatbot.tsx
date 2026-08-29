"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { resolvePublicApiUrl } from "@/lib/api";

const ChatBot = dynamic(
  () => import("@quickstart-ai/widget-react").then((m) => m.ChatBot),
  { ssr: false },
);

/** Site-wide chatbot on marketing/auth pages (dashboard uses its own project widget). */
export function SiteChatbot() {
  const pathname = usePathname();
  const clientId = process.env.NEXT_PUBLIC_DEMO_CLIENT_ID?.trim();
  const [apiUrl, setApiUrl] = useState<string | null>(null);

  useEffect(() => {
    setApiUrl(resolvePublicApiUrl());
  }, []);

  if (!clientId || !apiUrl || pathname?.startsWith("/dashboard")) return null;

  return (
    <ChatBot
      clientId={clientId}
      apiUrl={apiUrl}
      position="right"
      primaryColor="#0A0A0A"
    />
  );
}
