"use client";

import { Button } from "@repo/design-system/components/ui/button";
import type { ActionErrorMessages } from "@repo/internationalization";
import { CreditCard, Loader2 } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/auth/auth";
import { openBillingPortalAction } from "../actions";

interface ManageBillingFormProps {
  errors: ActionErrorMessages;
  organizationId: string;
  organizationSlug: string;
  locale: string;
}

export function ManageBillingForm({
  errors,
  organizationId,
  organizationSlug,
  locale,
}: ManageBillingFormProps) {
  const boundAction = openBillingPortalAction.bind(null, {
    organizationId,
    organizationSlug,
    locale,
  });

  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(boundAction, null);

  useEffect(() => {
    if (state && !state.success && state.error) {
      toast.error(errors.openBillingPortal, {
        description: state.error,
      });
    }
  }, [state, errors.openBillingPortal]);

  return (
    <form action={formAction}>
      <Button disabled={isPending} type="submit" variant="outline">
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
    </form>
  );
}
