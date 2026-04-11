import { getDictionary } from "@repo/internationalization";
import { Suspense } from "react";
import { env } from "@/lib/env";
import { validateOrgMembershipBySlug } from "@/servers/organization/queries";
import { InviteLinksTable } from "../components/invite-links-table";
import { InviteLinksTableSkeleton } from "../components/invite-links-table-skeleton";
import { getMemberPermissions } from "../utils";
import { getInviteLinks } from "./queries";
import { inviteLinksSearchParamsCache } from "./validations";

type InviteLinksPageProps = {
  params: Promise<{ locale: string; orgSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InviteLinksPage({
  params,
  searchParams,
}: InviteLinksPageProps) {
  const [{ locale, orgSlug }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const [orgContext, dict] = await Promise.all([
    validateOrgMembershipBySlug(orgSlug),
    getDictionary(locale),
  ]);

  const parsedParams = inviteLinksSearchParamsCache.parse(resolvedSearchParams);

  const inviteLinksPromise = getInviteLinks({
    ...parsedParams,
    organizationId: orgContext.organizationId,
  });

  const permissions = getMemberPermissions(orgContext.role);

  return (
    <Suspense fallback={<InviteLinksTableSkeleton />}>
      <InviteLinksTable
        baseUrl={env.BETTER_AUTH_URL}
        canManage={permissions.canManageInviteLinks}
        errors={dict.errors.action}
        inviteLinksPromise={inviteLinksPromise}
        organizationId={orgContext.organizationId}
      />
    </Suspense>
  );
}
