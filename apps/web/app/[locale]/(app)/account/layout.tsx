import { BreadcrumbProvider } from "@repo/design-system/components/layout/breadcrumb-context";
import { Main } from "@repo/design-system/components/layout/main";
import { SiteHeader } from "@repo/design-system/components/layout/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@repo/design-system/components/ui/sidebar";
import { isAdminAreaRole } from "@repo/auth/permissions";
import type { ReactNode } from "react";
import { ActivityTracker } from "@/components/activity-tracker";
import { requireAuth } from "@/lib/auth/auth";
import { AccountSidebar } from "./components/account-sidebar";

interface AccountLayoutProps {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
}

export default async function AccountLayout({
  children,
  params,
}: AccountLayoutProps) {
  const [{ locale }, session] = await Promise.all([params, requireAuth()]);
  const showAdmin = isAdminAreaRole(session.user.role);

  return (
    <SidebarProvider>
      <ActivityTracker />
      <AccountSidebar
        locale={locale}
        showAdmin={showAdmin}
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
