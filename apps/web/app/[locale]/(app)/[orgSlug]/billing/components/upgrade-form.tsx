"use client";

import { subscription } from "@repo/auth/client";
import { Button } from "@repo/design-system/components/ui/button";
import type { ActionErrorMessages } from "@repo/internationalization";
import {
  BILLING_INTERVALS,
  type BillingInterval,
  PLAN_DISPLAY_NAMES,
  type PlanName,
} from "@repo/utils/payment";
import { ArrowUp, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

interface UpgradeFormProps {
  billingInterval: BillingInterval;
  errors: ActionErrorMessages;
  locale: string;
  organizationId: string;
  organizationSlug: string;
  planName: PlanName;
}

export function UpgradeForm({
  planName,
  organizationId,
  organizationSlug,
  billingInterval,
  locale,
  errors,
}: UpgradeFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleUpgrade = () => {
    startTransition(async () => {
      const orgBase = `${window.location.origin}/${locale}/${organizationSlug}`;
      const checkoutBase = `${orgBase}/checkout`;
      const { error } = await subscription.upgrade({
        plan: planName,
        annual: billingInterval === BILLING_INTERVALS.YEARLY,
        referenceId: organizationId,
        // free→paid goes through Stripe Checkout (uses success/cancel URLs).
        successUrl: `${checkoutBase}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${checkoutBase}/canceled`,
        // paid→paid (e.g. pro→enterprise) updates the existing subscription via
        // a Stripe-hosted confirm flow and redirects here afterward — without
        // this it would fall back to the site root ("/").
        returnUrl: `${orgBase}/billing`,
      });

      if (error) {
        toast.error(errors.startCheckout, { description: error.message });
      }
      // On success, subscription.upgrade redirects the browser — to Stripe
      // Checkout for a new subscription, or the plan-change confirm flow for
      // an existing one.
    });
  };

  return (
    <Button
      className="w-full"
      disabled={isPending}
      onClick={handleUpgrade}
      type="button"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <ArrowUp className="mr-2 h-4 w-4" />
          Upgrade to {PLAN_DISPLAY_NAMES[planName]}
        </>
      )}
    </Button>
  );
}
