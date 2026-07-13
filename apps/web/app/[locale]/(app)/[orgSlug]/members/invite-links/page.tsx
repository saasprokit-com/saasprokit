import { TableSkeleton } from "@repo/design-system/components/data-table/table-skeleton";
import { SetBreadcrumbs } from "@repo/design-system/components/layout/breadcrumb-context";
import { ContentSection } from "@repo/design-system/components/layout/content-section";
import { getDictionary } from "@repo/internationalization";
import { Suspense } from "react";
import { env } from "@/lib/env";
import { orgRoutes } from "@/lib/routes";
import { validateOrgMembershipBySlug } from "@/servers/organization/queries";
import { getMemberPermissions } from "../utils";
import { InviteLinksTable } from "./components/invite-links-table";
import { getInviteLinks } from "./queries";
import { inviteLinksSearchParamsCache } from "./validations";

interface InviteLinksPageProps {
  params: Promise<{ locale: string; orgSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

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
          <InviteLinksTable
            baseUrl={env.BETTER_AUTH_URL}
            canManage={permissions.canManageInviteLinks}
            errors={dict.errors.action}
            inviteLinksPromise={inviteLinksPromise}
            organizationId={orgContext.organizationId}
          />
        </Suspense>
      </ContentSection>
    </>
  );
}
