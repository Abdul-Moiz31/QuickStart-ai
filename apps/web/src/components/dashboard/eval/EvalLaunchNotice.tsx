"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function EvalLaunchNotice({
  projectId,
  visible = false,
}: {
  projectId: string;
  visible?: boolean;
}) {
  if (!visible) return null;

  return (
    <div className="rounded-xl border border-ink/[0.08] bg-clay px-4 py-3 text-sm">
      <p className="font-medium text-ink">Test before production</p>
      <p className="mt-1 text-mute">
        Your chatbot is always available. Run eval or try Conversations to make sure it works
        smoothly for visitors.
      </p>
      <Link
        href={`/dashboard/projects/${projectId}/eval`}
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-ink underline-offset-2 hover:underline"
      >
        Go to Eval
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
