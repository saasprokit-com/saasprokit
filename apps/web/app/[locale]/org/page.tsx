import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/auth";
import { getDefaultOrganization } from "@/lib/organization/queries";
import { PAGE_ROUTES } from "@/lib/routes";

interface OrgRedirectPageProps {
  params: Promise<{ locale: string }>;
}

export default async function OrgRedirectPage({
  params,
}: OrgRedirectPageProps) {
  const [{ locale }, defaultOrg] = await Promise.all([
    params,
    getDefaultOrganization(),
    requireAuth(PAGE_ROUTES.ORG),
  ]);

  if (!defaultOrg) {
    redirect(`/${locale}${PAGE_ROUTES.ACCOUNT_NEW_ORG}`);
  }

  redirect(`/${locale}/${defaultOrg.slug}`);
}
