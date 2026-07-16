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

  return (
    <SidebarProvider>
      <ActivityTracker />
      <AccountSidebar locale={locale} user={session.user} />

      <SidebarInset>
        <BreadcrumbProvider>
          <SiteHeader />
          <Main>{children}</Main>
        </BreadcrumbProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
