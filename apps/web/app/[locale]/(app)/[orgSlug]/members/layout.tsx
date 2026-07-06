import { SetBreadcrumbs } from "@repo/design-system/components/layout/breadcrumb-context";
import { ContentSection } from "@repo/design-system/components/layout/content-section";
import type { ReactNode } from "react";
import { orgRoutes } from "@/lib/routes";

interface MembersLayoutProps {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default async function MembersLayout({
  children,
  params,
}: MembersLayoutProps) {
  const { orgSlug } = await params;

  return (
    <>
      <SetBreadcrumbs
        items={[
          { label: "Organization", href: orgRoutes.home(orgSlug) },
          { label: "Members" },
        ]}
      />
      <ContentSection
        description="Manage your organization members, invitations, and invite links"
        title="Members"
      >
        {children}
      </ContentSection>
    </>
  );
}
