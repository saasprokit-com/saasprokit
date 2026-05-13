import { SetBreadcrumbs } from "@repo/design-system/components/layout/breadcrumb-context";
import { ContentSection } from "@repo/design-system/components/layout/content-section";
import { getDictionary } from "@repo/internationalization";
import { getServerSession } from "@/lib/auth/auth";
import { canUserCreateOrg } from "@/lib/billing/subscription-queries";
import { accountRoutes } from "@/lib/routes";
import { CreateOrganizationForm } from "./components/create-organization-form";
import { UpgradePrompt } from "./components/upgrade-prompt";

export const metadata = {
  title: "New Workspace",
  description: "Create a new workspace for your team",
};

interface NewOrgPageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewOrgPage({ params }: NewOrgPageProps) {
  const { locale } = await params;

  const [session, dict] = await Promise.all([
    getServerSession(),
    getDictionary(locale),
  ]);

  const { allowed, reason, code } = await canUserCreateOrg(session!.user.id);

  return (
    <>
      <SetBreadcrumbs
        items={[
          { label: "Account", href: accountRoutes.profile() },
          { label: "New Workspace" },
        ]}
      />
      <ContentSection
        contentClassName="lg:max-w-2xl"
        description="Set up a new workspace for your team or project."
        title="New Workspace"
      >
        {allowed ? (
          <CreateOrganizationForm errors={dict.errors.action} />
        ) : (
          <UpgradePrompt reason={reason} showUpgrade={code !== "max_reached"} />
        )}
      </ContentSection>
    </>
  );
}
