import { BreadcrumbProvider } from "@repo/design-system/components/layout/breadcrumb-context";
import { Main } from "@repo/design-system/components/layout/main";
import { SiteHeader } from "@repo/design-system/components/layout/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@repo/design-system/components/ui/sidebar";
import type { ReactNode } from "react";
import { requireAdminArea } from "@/lib/auth/admin";
import { getServerSession } from "@/lib/auth/auth";
import { AdminSidebar } from "./components/admin-sidebar";

interface AdminLayoutProps {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
}

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const [{ locale }, ctx, session] = await Promise.all([
    params,
    requireAdminArea(),
    getServerSession(),
  ]);

  return (
    <SidebarProvider>
      {session?.user ? (
        <AdminSidebar
          isAdmin={ctx.isAdmin}
          locale={locale}
          user={session.user}
        />
      ) : null}

      <SidebarInset>
        <BreadcrumbProvider>
          <SiteHeader />
          <Main>{children}</Main>
        </BreadcrumbProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
