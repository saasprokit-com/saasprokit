import { revalidateOrgPage } from "@/lib/infrastructure/revalidation";
import { ORG_PAGES, orgRoutes } from "@/lib/routes";
import { validateOrgMembershipBySlug } from "@/servers/organization/queries";
import { CheckoutErrorCard } from "./components/checkout-error-card";
import { CheckoutSuccessCard } from "./components/checkout-success-card";
import { verifyCheckoutSession } from "./verify-session";

interface CheckoutSuccessPageProps {
  params: Promise<{ locale: string; orgSlug: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: CheckoutSuccessPageProps) {
  const { locale, orgSlug } = await params;
  const { session_id: sessionId } = await searchParams;

  const orgContext = await validateOrgMembershipBySlug(orgSlug);
  const billingHref = `/${locale}${orgRoutes.billing(orgSlug)}`;
  const dashboardHref = `/${locale}/${orgSlug}`;

  const result = await verifyCheckoutSession(
    sessionId,
    orgContext.organizationId
  );

  if (result.ok) {
    // Subscription is paid and belongs to this org — refresh the billing
    // page cache so the new plan is visible immediately.
    await revalidateOrgPage(orgSlug, ORG_PAGES.BILLING);
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl">
        {result.ok ? (
          <CheckoutSuccessCard
            billingHref={billingHref}
            dashboardHref={dashboardHref}
          />
        ) : (
          <CheckoutErrorCard
            billingHref={billingHref}
            reason={result.reason}
          />
        )}
      </div>
    </div>
  );
}
