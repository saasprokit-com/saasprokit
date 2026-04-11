import { SetBreadcrumbs } from "@repo/design-system/components/layout/breadcrumb-context";
import { ContentSection } from "@repo/design-system/components/layout/content-section";
import { Badge } from "@repo/design-system/components/ui/badge";
import type { ReactNode } from "react";
import { orgRoutes } from "@/lib/routes";
import { validateOrgMembershipBySlug } from "@/servers/organization/queries";
import { MembersNav } from "./components/members-nav";
import { getMembersLayoutCounts } from "./queries";

type MembersLayoutProps = {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
};

export default async function MembersLayout({
  children,
  params,
}: MembersLayoutProps) {
  const { orgSlug } = await params;
  const orgContext = await validateOrgMembershipBySlug(orgSlug);

  const { memberCount, pendingInvitationCount, activeInviteLinkCount } =
    await getMembersLayoutCounts(orgContext.organizationId);

  return (
    <>
      <SetBreadcrumbs
        items={[
          { label: "Organization", href: orgRoutes.home(orgSlug) },
          { label: "Members" },
        ]}
      />
      <ContentSection
        action={<Badge variant="outline">{memberCount} member(s)</Badge>}
        description="Manage your organization members, invitations, and invite links"
        title="Members"
      >
        <MembersNav
          activeInviteLinkCount={activeInviteLinkCount}
          memberCount={memberCount}
          orgSlug={orgSlug}
          pendingInvitationCount={pendingInvitationCount}
        />

        {children}
      </ContentSection>
    </>
  );
}
