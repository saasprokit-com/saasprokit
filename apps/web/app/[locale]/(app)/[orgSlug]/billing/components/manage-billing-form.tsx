"use client";

import { subscription } from "@repo/auth/client";
import { Button } from "@repo/design-system/components/ui/button";
import type { ActionErrorMessages } from "@repo/internationalization";
import { CreditCard, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

interface ManageBillingFormProps {
  errors: ActionErrorMessages;
  locale: string;
  organizationId: string;
  organizationSlug: string;
}

export function ManageBillingForm({
  errors,
  organizationId,
  organizationSlug,
  locale,
}: ManageBillingFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleOpenPortal = () => {
    startTransition(async () => {
      const { error } = await subscription.billingPortal({
        referenceId: organizationId,
        returnUrl: `${window.location.origin}/${locale}/${organizationSlug}/billing`,
      });

      if (error) {
        toast.error(errors.openBillingPortal, { description: error.message });
      }
      // On success, subscription.billingPortal redirects the browser to Stripe.
    });
  };

  return (
    <Button
      disabled={isPending}
      onClick={handleOpenPortal}
      type="button"
      variant="outline"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Opening...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Manage Billing
        </>
      )}
    </Button>
  );
}
