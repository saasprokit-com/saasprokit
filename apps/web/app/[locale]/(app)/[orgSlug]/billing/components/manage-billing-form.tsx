"use client";

import { Button } from "@repo/design-system/components/ui/button";
import type { ActionErrorMessages } from "@repo/internationalization";
import { CreditCard, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { openBillingPortalAction } from "../actions";

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
      const result = await openBillingPortalAction({
        organizationId,
        organizationSlug,
        locale,
      });

      if (result.success && result.data?.url) {
        window.location.href = result.data.url;
        return;
      }

      toast.error(errors.openBillingPortal, { description: result.error });
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
