import type React from "react";
import {
  buildLocalePath,
  revalidateOrgPage,
} from "@/lib/infrastructure/revalidation";
import { ORG_PAGES, orgRoutes } from "@/lib/routes";
import { validateOrgMembershipBySlug } from "@/servers/organization/queries";
import { CheckoutErrorCard } from "./components/checkout-error-card";
import { CheckoutProcessingCard } from "./components/checkout-processing-card";
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
  const billingHref = buildLocalePath(locale, orgRoutes.billing(orgSlug));
  const dashboardHref = buildLocalePath(locale, `/${orgSlug}`);

  const result = await verifyCheckoutSession(
    sessionId,
    orgContext.organizationId
  );

  if (result.ok) {
    // Subscription is paid and belongs to this org — refresh the billing
    // page cache so the new plan is visible immediately. Pass the locale
    // explicitly so we don't depend on the Referer (Stripe Checkout's
    // domain) for the rewrite target.
    await revalidateOrgPage(orgSlug, ORG_PAGES.BILLING, locale);
  }

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
    body: <CheckoutErrorCard billingHref={billingHref} reason={result.reason} />,
  };
}
