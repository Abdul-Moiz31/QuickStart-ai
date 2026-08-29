import { redirect } from "next/navigation";

export default async function CredentialsRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/projects/${id}/settings?tab=credentials`);
}
