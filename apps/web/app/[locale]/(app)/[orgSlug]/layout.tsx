import { BreadcrumbProvider } from "@repo/design-system/components/layout/breadcrumb-context";
import { Main } from "@repo/design-system/components/layout/main";
import { SiteHeader } from "@repo/design-system/components/layout/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@repo/design-system/components/ui/sidebar";
import type { ReactNode } from "react";
import { ActivityTracker } from "@/components/activity-tracker";
import { checkOrgPermission, requireAuth } from "@/lib/auth/auth";
import {
  getUserOrganizations,
  validateOrgMembershipBySlug,
} from "@/servers/organization/queries";
import { OrgSidebar } from "./components/org-sidebar";

type OrgLayoutProps = {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { locale, orgSlug } = await params;

  // - If unauthenticated, validateOrgMembershipBySlug redirects, aborting the render
  const [org, { organizations, defaultOrganizationId }] = await Promise.all([
    validateOrgMembershipBySlug(orgSlug),
    getUserOrganizations(),
  ]);

  const [session, canManageBilling] = await Promise.all([
    requireAuth(),
    checkOrgPermission(org.organizationId, {
      organization: ["update"],
    }).then((r) => !!r),
  ]);

  const user = {
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.image ?? undefined,
  };

  return (
    <SidebarProvider>
      <ActivityTracker />
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
