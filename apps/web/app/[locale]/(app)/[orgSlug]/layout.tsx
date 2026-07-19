import { canOrg, isAdminAreaRole } from "@repo/auth/permissions";
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
import { adminRoutes } from "@/lib/routes";
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

  // getActiveOrganization() reuses the memoized getUserOrganizations(),
  // so these three resolve against a single membership query.
  const [org, { organizations, defaultOrganizationId }, session] =
    await Promise.all([
      getActiveOrganization(orgSlug),
      getUserOrganizations(),
      requireAuth(),
    ]);

  // In-memory check against the role we already hold — no extra query.
  const canManageBilling = canOrg(org.role, { organization: ["update"] });

  // Link visibility only; the /admin area re-gates on a fresh DB role.
  const adminUrl = isAdminAreaRole(session.user.role)
    ? `/${locale}${adminRoutes.dashboard()}`
    : undefined;

  const user = {
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.image ?? undefined,
  };

  return (
    <SidebarProvider>
      <ActivityTracker />
      <OrgSidebar
        activeOrganization={organizations.find(
          (item) => item.id === org.organizationId
        )}
        adminUrl={adminUrl}
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
