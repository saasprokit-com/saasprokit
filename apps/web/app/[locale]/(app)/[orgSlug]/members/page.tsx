import { getDictionary } from "@repo/internationalization";
import { Suspense } from "react";
import { validateOrgMembershipBySlug } from "@/servers/organization/queries";
import { MembersTable } from "./components/members-table";
import { MembersTableSkeleton } from "./components/members-table-skeleton";
import { getMembers } from "./queries";
import { getMemberPermissions } from "./utils";
import { membersSearchParamsCache } from "./validations";

interface MembersPageProps {
  params: Promise<{ locale: string; orgSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MembersPage({
  params,
  searchParams,
}: MembersPageProps) {
  const [{ locale, orgSlug }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const [orgContext, dict] = await Promise.all([
    validateOrgMembershipBySlug(orgSlug),
    getDictionary(locale),
  ]);

  const parsedParams = membersSearchParamsCache.parse(resolvedSearchParams);

  const membersPromise = getMembers({
    ...parsedParams,
    organizationId: orgContext.organizationId,
  });

  const permissions = getMemberPermissions(orgContext.role);

  return (
    <Suspense fallback={<MembersTableSkeleton />}>
      <MembersTable
        currentUserId={orgContext.userId}
        errors={dict.errors.action}
        membersPromise={membersPromise}
        organizationId={orgContext.organizationId}
        permissions={permissions}
      />
    </Suspense>
  );
}
