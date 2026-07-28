import { SetBreadcrumbs } from "@repo/design-system/components/layout/breadcrumb-context";
import { ContentSection } from "@repo/design-system/components/layout/content-section";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { getDictionary } from "@repo/internationalization";
import { OrgPermissionGate } from "@/components/org-permission-gate";
import { getActiveSubscription } from "@/lib/billing/subscription-queries";
import { getActiveOrganization } from "@/lib/organization/queries";
import { orgRoutes } from "@/lib/routes";
import { BillingActions } from "./components/billing-actions";
import { ChangePlan } from "./components/change-plan";
import { UsageStats } from "./components/usage-stats";

interface OrgBillingPageProps {
  params: Promise<{ locale: string; orgSlug: string }>;
}

export default async function OrgBillingPage({ params }: OrgBillingPageProps) {
  const { locale, orgSlug } = await params;
  const [orgContext, dict] = await Promise.all([
    getActiveOrganization(orgSlug),
    getDictionary(locale),
  ]);
  const subscription = await getActiveSubscription(orgContext.organizationId);

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
        <OrgPermissionGate
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
          permissions={{ organization: ["update"] }}
          role={orgContext.role}
        >
          <ChangePlan
            errors={dict.errors.action}
            organizationId={orgContext.organizationId}
          />
          <UsageStats organizationId={orgContext.organizationId} />
          {subscription ? (
            <BillingActions
              errors={dict.errors.action}
              organizationId={orgContext.organizationId}
              subscription={subscription}
            />
          ) : null}
        </OrgPermissionGate>
      </ContentSection>
    </>
  );
}
