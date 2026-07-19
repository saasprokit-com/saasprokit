"use client";

import { Button } from "@repo/design-system/components/ui/button";
import type { ActionErrorMessages } from "@repo/internationalization";
import {
  type BillingInterval,
  PLAN_DISPLAY_NAMES,
  type PlanName,
} from "@repo/utils/payment";
import { ArrowUp, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { upgradeSubscriptionAction } from "../actions";

interface UpgradeFormProps {
  billingInterval: BillingInterval;
  errors: ActionErrorMessages;
  locale: string;
  organizationId: string;
  organizationSlug: string;
  planName: Exclude<PlanName, "free">;
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
      const result = await upgradeSubscriptionAction({
        planName,
        organizationId,
        organizationSlug,
        locale,
        billingInterval,
      });

      if (result.success && result.data?.url) {
        // Redirect to Stripe Checkout (new subscription) or the plan-change
        // confirm flow (existing subscription).
        window.location.href = result.data.url;
        return;
      }

      toast.error(errors.startCheckout, { description: result.error });
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
