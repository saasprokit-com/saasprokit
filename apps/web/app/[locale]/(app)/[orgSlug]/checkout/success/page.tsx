import type React from "react";
import { verifyCheckoutSession } from "@/lib/billing/checkout-queries";
import { buildLocalePath } from "@/lib/infrastructure/revalidation";
import { getActiveOrganization } from "@/lib/organization/queries";
import { orgRoutes } from "@/lib/routes";
import { CheckoutErrorCard } from "./components/checkout-error-card";
import { CheckoutProcessingCard } from "./components/checkout-processing-card";
import { CheckoutSuccessCard } from "./components/checkout-success-card";

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

  const orgContext = await getActiveOrganization(orgSlug);
  const billingHref = buildLocalePath(locale, orgRoutes.billing(orgSlug));
  const dashboardHref = buildLocalePath(locale, `/${orgSlug}`);

  const result = await verifyCheckoutSession(
    sessionId,
    orgContext.organizationId
  );

  const { heading, body } = renderCheckoutResult({
    result,
    billingHref,
    dashboardHref,
  });

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="sr-only">{heading}</h1>
        {body}
      </div>
    </div>
  );
}

function renderCheckoutResult({
  result,
  billingHref,
  dashboardHref,
}: {
  result: Awaited<ReturnType<typeof verifyCheckoutSession>>;
  billingHref: string;
  dashboardHref: string;
}): { heading: string; body: React.ReactNode } {
  if (result.ok) {
    return {
      heading: "Subscription activated",
      body: (
        <CheckoutSuccessCard
          billingHref={billingHref}
          dashboardHref={dashboardHref}
          planName={result.planName}
        />
      ),
    };
  }
  if (result.reason === "not_paid") {
    return {
      heading: "Finalizing your subscription",
      body: <CheckoutProcessingCard billingHref={billingHref} />,
    };
  }
  return {
    heading: "Checkout could not be confirmed",
    body: (
      <CheckoutErrorCard billingHref={billingHref} reason={result.reason} />
    ),
  };
}
