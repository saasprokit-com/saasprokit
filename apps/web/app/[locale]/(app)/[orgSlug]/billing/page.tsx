import { SetBreadcrumbs } from "@repo/design-system/components/layout/breadcrumb-context";
import { ContentSection } from "@repo/design-system/components/layout/content-section";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { getDictionary } from "@repo/internationalization";
import { PermissionGate } from "@/components/permission-gate";
import { orgRoutes } from "@/lib/routes";
import { validateOrgMembershipBySlug } from "@/servers/organization/queries";
import { BillingActions } from "./components/billing-actions";
import { ChangePlan } from "./components/change-plan";
import { CurrentPlan } from "./components/current-plan";
import { UsageStats } from "./components/usage-stats";
import { getBillingUsageData } from "./queries";

interface OrgBillingPageProps {
  params: Promise<{ locale: string; orgSlug: string }>;
}

export default async function OrgBillingPage({ params }: OrgBillingPageProps) {
  const { locale, orgSlug } = await params;
  const [orgContext, dict] = await Promise.all([
    validateOrgMembershipBySlug(orgSlug),
    getDictionary(locale),
  ]);

  const usageData = await getBillingUsageData(orgContext.organizationId);

  return (
    <>
      <SetBreadcrumbs
        items={[
          { label: "Organization", href: orgRoutes.home(orgSlug) },
          { label: "Billing" },
        ]}
      />
      <ContentSection
        description="Manage your organization's subscription and billing"
        title="Billing"
      >
        <PermissionGate
          fallback={
            <Card>
              <CardHeader>
                <CardTitle>Access Restricted</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Only organization owners and admins can manage billing. Please
                  contact your organization administrator for billing changes.
                </p>
              </CardContent>
            </Card>
          }
          organizationId={orgContext.organizationId}
          permissions={{ organization: ["update"] }}
        >
          <CurrentPlan />
          <ChangePlan
            errors={dict.errors.action}
            memberCount={usageData.usageStats.members.current}
            organizationId={orgContext.organizationId}
            storageMB={usageData.usageStats.storage.currentMB}
          />
          <UsageStats {...usageData} />
          <BillingActions
            errors={dict.errors.action}
            organizationId={orgContext.organizationId}
            organizationSlug={orgSlug}
          />
        </PermissionGate>
      </ContentSection>
    </>
  );
}
