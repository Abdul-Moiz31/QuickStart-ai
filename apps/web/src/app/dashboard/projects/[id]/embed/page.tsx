"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, getStoredToken } from "@/lib/api";
export default function EmbedPage() {
  const { id } = useParams<{ id: string }>();
  const [clientId, setClientId] = useState("YOUR_CLIENT_ID");
  const [copied, setCopied] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3100";

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api<{ credentials: { clientId: string }[] }>(`/api/v1/projects/${id}`, { token }).then(
      (res) => {
        if (res.credentials[0]?.clientId) setClientId(res.credentials[0].clientId);
      },
    );
  }, [id]);

  const reactCode = `import { ChatBot } from "@quickstart-ai/widget-react";

<ChatBot
  clientId="${clientId}"
  apiUrl="${apiUrl}"
/>`;

  const htmlCode = `<script
  src="https://cdn.quickstart.ai/widget.js"
  data-client-id="${clientId}"
  data-api-url="${apiUrl}"
  async
></script>`;

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
      <h1 className="font-sans text-2xl font-bold text-ink md:text-3xl">Embed</h1>
      <p className="mt-2 text-sm text-mute">Add the chatbot to your site with one line of code.</p>

      <div className="mt-6 space-y-5">
        {[
          { title: "React", code: reactCode },
          { title: "HTML / JS", code: htmlCode },
        ].map((b) => (
          <div key={b.title} className="qs-code-frame">
            <div className="qs-code-bar">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-sm text-ink">{b.title}</span>
              </div>
              <button
                type="button"
                onClick={() => copy(b.code)}
                className="font-mono text-[10px] uppercase tracking-wider text-sky-300/80"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="qs-code-body whitespace-pre-wrap text-[12px]">{b.code}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
