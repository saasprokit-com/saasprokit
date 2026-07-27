"use client";

import { Button } from "@repo/design-system/components/ui/button";
import type { ActionErrorMessages } from "@repo/internationalization";
import {
  type BillingInterval,
  PLAN_DISPLAY_NAMES,
  type PlanName,
} from "@repo/utils/payment";
import { ArrowUp, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { upgradeSubscriptionAction } from "../actions";

interface UpgradeButtonProps {
  billingInterval: BillingInterval;
  errors: ActionErrorMessages;
  organizationId: string;
  planName: Exclude<PlanName, "free">;
}

export function UpgradeButton({
  planName,
  organizationId,
  billingInterval,
  errors,
}: UpgradeButtonProps) {
  const { locale, orgSlug } = useParams<{ locale: string; orgSlug: string }>();
  const [isPending, startTransition] = useTransition();

  const handleUpgrade = () => {
    startTransition(async () => {
      const result = await upgradeSubscriptionAction({
        planName,
        organizationId,
        organizationSlug: orgSlug,
        locale,
        billingInterval,
      });

      if (result.success && result.data?.url) {
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
