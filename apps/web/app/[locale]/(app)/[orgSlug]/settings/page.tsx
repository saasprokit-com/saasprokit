import { SetBreadcrumbs } from "@repo/design-system/components/layout/breadcrumb-context";
import { ContentSection } from "@repo/design-system/components/layout/content-section";
import { getDictionary } from "@repo/internationalization";
import { notFound } from "next/navigation";
import { checkOrgPermission } from "@/lib/auth/auth";
import { orgRoutes } from "@/lib/routes";
import { validateOrgMembershipBySlug } from "@/servers/organization/queries";
import { OrgSettingsForm } from "./components/org-settings-form";
import { getOrgSettingsData } from "./queries";

interface OrgSettingsPageProps {
  params: Promise<{ locale: string; orgSlug: string }>;
}

export default async function OrgSettingsPage({
  params,
}: OrgSettingsPageProps) {
  const { locale, orgSlug } = await params;
  const orgContext = await validateOrgMembershipBySlug(orgSlug);

  const [organization, dict, permissionResult] = await Promise.all([
    getOrgSettingsData(orgContext.organizationId),
    getDictionary(locale),
    checkOrgPermission(orgContext.organizationId, {
      organization: ["update"],
    }),
  ]);

  if (!organization) {
    notFound();
  }

  const canEdit = !!permissionResult;

  return (
    <>
      <SetBreadcrumbs
        items={[
          { label: "Organization", href: orgRoutes.home(orgSlug) },
          { label: "Settings" },
        ]}
      />
      <ContentSection
        contentClassName="lg:max-w-2xl"
        description="Manage your organization settings"
        title="Settings"
      >
        <OrgSettingsForm
          canEdit={canEdit}
          errors={dict.errors.action}
          organization={organization}
          userRole={orgContext.role}
        />
      </ContentSection>
    </>
  );
}
