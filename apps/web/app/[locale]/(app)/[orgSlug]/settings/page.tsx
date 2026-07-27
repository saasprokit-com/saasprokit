import { canOrg } from "@repo/auth/permissions";
import { SetBreadcrumbs } from "@repo/design-system/components/layout/breadcrumb-context";
import { ContentSection } from "@repo/design-system/components/layout/content-section";
import { getDictionary } from "@repo/internationalization";
import { notFound } from "next/navigation";
import { getActiveOrganization } from "@/lib/organization/queries";
import { orgRoutes } from "@/lib/routes";
import { OrgSettingsForm } from "./components/org-settings-form";
import { getOrgSettingsData } from "./queries";

interface OrgSettingsPageProps {
  params: Promise<{ locale: string; orgSlug: string }>;
}

export default async function OrgSettingsPage({
  params,
}: OrgSettingsPageProps) {
  const { locale, orgSlug } = await params;
  const dictPromise = getDictionary(locale);
  const orgContext = await getActiveOrganization(orgSlug);

  const [organization, dict] = await Promise.all([
    getOrgSettingsData(orgContext.organizationId),
    dictPromise,
  ]);

  if (!organization) {
    notFound();
  }

  const canEdit = canOrg(orgContext.role, { organization: ["update"] });

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
