import { redirect } from "next/navigation";
import { PAGE_ROUTES } from "@/lib/routes";
import { getDefaultOrganization } from "@/servers/organization/queries";

interface OrgRedirectPageProps {
  params: Promise<{ locale: string }>;
}

export default async function OrgRedirectPage({
  params,
}: OrgRedirectPageProps) {
  const [{ locale }, defaultOrg] = await Promise.all([
    params,
    getDefaultOrganization(),
  ]);

  if (!defaultOrg) {
    redirect(`/${locale}${PAGE_ROUTES.ACCOUNT_NEW_ORG}`);
  }

  redirect(`/${locale}/${defaultOrg.slug}`);
}
