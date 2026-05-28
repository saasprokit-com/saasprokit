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
  organizationId: string;
  organizationSlug: string;
  planName: PlanName;
  billingInterval: BillingInterval;
  locale: string;
  errors: ActionErrorMessages;
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
      const checkoutBase = `${window.location.origin}/${locale}/${organizationSlug}/checkout`;
      const { error } = await subscription.upgrade({
        plan: planName,
        annual: billingInterval === BILLING_INTERVALS.YEARLY,
        referenceId: organizationId,
        successUrl: `${checkoutBase}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${checkoutBase}/canceled`,
      });

      if (error) {
        toast.error(errors.startCheckout, { description: error.message });
      }
      // On success, subscription.upgrade redirects the browser to Stripe Checkout.
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
