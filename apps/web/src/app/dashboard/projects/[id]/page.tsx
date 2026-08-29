"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProjectIndexPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => {
    if (id) router.replace(`/dashboard/projects/${id}/knowledge`);
  }, [id, router]);
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-mute">Opening project…</div>
  );
}
