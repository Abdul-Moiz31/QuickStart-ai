import { redirect } from "next/navigation";

/** Legacy route — notifications live on /notifications now. */
export default function IntegrationsRedirect({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/dashboard/projects/${params.id}/notifications`);
}
