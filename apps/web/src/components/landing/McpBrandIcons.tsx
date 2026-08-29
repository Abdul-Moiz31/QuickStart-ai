type BrandIconProps = {
  className?: string;
};

export function ChatGptIcon({ className = "h-6 w-6" }: BrandIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .742 7.097 5.98 5.98 0 0 0 .511 4.911 6.051 6.051 0 0 0 6.514 2.899A5.985 5.985 0 0 0 13.704 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.191-6.073zM13.694 22.258a4.478 4.478 0 0 1-2.876-1.041l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.306 18.301a4.485 4.485 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.434-4.649zM2.34 7.895a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.803-2.767a4.5 4.5 0 0 1 6.905 4.656zm-12.649 4.135l-2.02-1.163a.08.08 0 0 1-.038-.057V6.956a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 6.342a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

export function CursorIcon({ className = "h-6 w-6" }: BrandIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.25 3.75 7.5v9L12 21.75 20.25 16.5v-9L12 2.25Zm0 2.35 5.85 3.52v5.76L12 17.4l-5.85-3.52V8.12 12 4.6Z" />
    </svg>
  );
}

export function ClaudeIcon({ className = "h-6 w-6" }: BrandIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.5c-.4 0-.8.2-1 .6L8.2 8.4l-5.8 1c-.5.1-.9.5-1 1s.1 1 .5 1.3l4.5 3.5-1.5 5.6c-.1.5.1 1 .5 1.3.4.3 1 .3 1.4 0L12 18.8l5.7 3.3c.4.3 1 .2 1.4-.1.4-.3.6-.8.5-1.3l-1.5-5.6 4.5-3.5c.4-.3.6-.8.5-1.3-.1-.5-.5-.9-1-1l-5.8-1-2.8-5.3c-.2-.4-.6-.6-1-.6z" />
    </svg>
  );
}

export const MCP_BRANDS = [
  {
    name: "ChatGPT",
    Icon: ChatGptIcon,
    tint: "text-[#10A37F]",
    href: "https://chatgpt.com",
  },
  {
    name: "Cursor",
    Icon: CursorIcon,
    tint: "text-ink",
    href: "https://cursor.com",
  },
  {
    name: "Claude",
    Icon: ClaudeIcon,
    tint: "text-[#D97757]",
    href: "https://claude.ai",
  },
] as const;
