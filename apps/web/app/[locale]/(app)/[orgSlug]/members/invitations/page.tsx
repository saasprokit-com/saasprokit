import { TableSkeleton } from "@repo/design-system/components/data-table/table-skeleton";
import { SetBreadcrumbs } from "@repo/design-system/components/layout/breadcrumb-context";
import { ContentSection } from "@repo/design-system/components/layout/content-section";
import { getDictionary } from "@repo/internationalization";
import { Suspense } from "react";
import { orgRoutes } from "@/lib/routes";
import { validateOrgMembershipBySlug } from "@/servers/organization/queries";
import { getMemberPermissions } from "../utils";
import { InvitationsTable } from "./components/invitations-table";
import { getInvitations } from "./queries";
import { invitationsSearchParamsCache } from "./validations";

interface InvitationsPageProps {
  params: Promise<{ locale: string; orgSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function InvitationsPage({
  params,
  searchParams,
}: InvitationsPageProps) {
  const [{ locale, orgSlug }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const [orgContext, dict] = await Promise.all([
    validateOrgMembershipBySlug(orgSlug),
    getDictionary(locale),
  ]);

  const parsedParams = invitationsSearchParamsCache.parse(resolvedSearchParams);

  const invitationsPromise = getInvitations({
    ...parsedParams,
    organizationId: orgContext.organizationId,
  });

  const permissions = getMemberPermissions(orgContext.role);

  return (
    <>
      <SetBreadcrumbs
        items={[
          { label: "Organization", href: orgRoutes.home(orgSlug) },
          { label: "Invitations" },
        ]}
      />
      <ContentSection
        description="Manage your organization's invitations and invite links"
        title="Invitations"
      >
        <Suspense fallback={<TableSkeleton />}>
          <InvitationsTable
            canManage={permissions.canManageInvitations}
            errors={dict.errors.action}
            invitationsPromise={invitationsPromise}
            organizationId={orgContext.organizationId}
          />
        </Suspense>
      </ContentSection>
    </>
  );
}
