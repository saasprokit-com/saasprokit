import { canOrg } from "@repo/auth/permissions";
import { BreadcrumbProvider } from "@repo/design-system/components/layout/breadcrumb-context";
import { Main } from "@repo/design-system/components/layout/main";
import { SiteHeader } from "@repo/design-system/components/layout/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@repo/design-system/components/ui/sidebar";
import type { ReactNode } from "react";
import { ActivityTracker } from "@/components/activity-tracker";
import { requireAuth } from "@/lib/auth/auth";
import {
  getActiveOrganization,
  getUserOrganizations,
} from "@/servers/organization/queries";
import { OrgSidebar } from "./components/org-sidebar";

interface OrgLayoutProps {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string; orgSlug: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { locale, orgSlug } = await params;

  const [org, { organizations, defaultOrganizationId }, session] =
    await Promise.all([
      getActiveOrganization(orgSlug),
      getUserOrganizations(),
      requireAuth(),
    ]);

  // In-memory check against the role we already hold — no extra query.
  const canManageBilling = canOrg(org.role, { organization: ["update"] });

  return (
    <SidebarProvider>
      <ActivityTracker />
      <OrgSidebar
        activeOrganization={organizations.find(
          (item) => item.id === org.organizationId
        )}
        canManageBilling={canManageBilling}
        defaultOrganizationId={defaultOrganizationId}
        locale={locale}
        organizations={organizations}
        orgSlug={orgSlug}
        user={session.user}
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
