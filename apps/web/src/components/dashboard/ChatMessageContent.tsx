"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Strip basic markdown for inbox previews. */
export function plainChatPreview(text: string, max = 140): string {
  const plain = plainChatPreviewPlain(text);
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max).trim()}…`;
}

function plainChatPreviewPlain(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\n+/g, " ")
    .trim();
}

/** First N words for compact inbox preview. */
export function plainChatPreviewWords(text: string, maxWords = 9): string {
  const words = plainChatPreviewPlain(text).split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}…`;
}

export function ChatMessageContent({
  content,
  inverted = false,
}: {
  content: string;
  inverted?: boolean;
}) {
  if (!content.trim()) return null;

  return (
    <div className={inverted ? "qs-chat-md qs-chat-md-invert" : "qs-chat-md"}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

export function ChatTypingIndicator({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-3 ${
        dark ? "bg-[#171717]" : "border border-ink/[0.08] bg-white"
      }`}
      aria-label="Assistant is typing"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${dark ? "bg-neutral-400" : "bg-mute/70"}`}
          style={{
            animation: "qs-chat-bounce 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}
