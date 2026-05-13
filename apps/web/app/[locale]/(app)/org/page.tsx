import { redirect } from "next/navigation";
import { PAGE_ROUTES } from "@/lib/routes";
import { getDefaultOrganization } from "@/servers/organization/queries";

interface OrgRedirectPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Post-auth trampoline — redirects to the user's default workspace.
 * Workspace creation is handled by the parent AppLayout.
 */
export default async function OrgRedirectPage({
  params,
}: OrgRedirectPageProps) {
  const { locale } = await params;
  const defaultOrg = await getDefaultOrganization();

  if (!defaultOrg) {
    redirect(`/${locale}${PAGE_ROUTES.ACCOUNT_NEW_ORG}`);
  }

  redirect(`/${locale}/${defaultOrg.slug}`);
}
