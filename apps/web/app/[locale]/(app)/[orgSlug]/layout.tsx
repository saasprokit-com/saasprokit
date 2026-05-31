import { BreadcrumbProvider } from "@repo/design-system/components/layout/breadcrumb-context";
import { Main } from "@repo/design-system/components/layout/main";
import { SiteHeader } from "@repo/design-system/components/layout/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@repo/design-system/components/ui/sidebar";
import type { ReactNode } from "react";
import { ActivityTracker } from "@/components/activity-tracker";
import { SyncActiveOrganization } from "@/components/sync-active-organization";
import { checkOrgPermission, requireAuth } from "@/lib/auth/auth";
import {
  getUserOrganizations,
  validateOrgMembershipBySlug,
} from "@/servers/organization/queries";
import { OrgSidebar } from "./components/org-sidebar";

interface OrgLayoutProps {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string; orgSlug: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { locale, orgSlug } = await params;

  // requireAuth() is independent — run it in parallel with org queries
  const [org, { organizations, defaultOrganizationId }, session] =
    await Promise.all([
      validateOrgMembershipBySlug(orgSlug),
      getUserOrganizations(),
      requireAuth(),
    ]);

  // checkOrgPermission depends on org.organizationId, must run after
  const canManageBilling = await checkOrgPermission(org.organizationId, {
    organization: ["update"],
  }).then((r) => !!r);

  const user = {
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.image ?? undefined,
  };

  return (
    <SidebarProvider>
      <ActivityTracker />
      <SyncActiveOrganization organizationId={org.organizationId} />
      <OrgSidebar
        activeOrganization={{
          id: org.organizationId,
          name: org.organizationName,
          slug: org.organizationSlug,
        }}
        canManageBilling={canManageBilling}
        defaultOrganizationId={defaultOrganizationId}
        locale={locale}
        organizations={organizations}
        orgSlug={orgSlug}
        user={user}
      />
      <SidebarInset>
        <BreadcrumbProvider>
          <SiteHeader />
          <Main>{children}</Main>
        </BreadcrumbProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
