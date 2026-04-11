"use client";

import { Button } from "@repo/design-system/components/ui/button";
import type { ActionErrorMessages } from "@repo/internationalization";
import { PLAN_DISPLAY_NAMES } from "@repo/utils/payment";
import { ArrowUp, Loader2 } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/auth/auth";
import { startCheckoutAction } from "../actions";
import type { CheckoutRequest } from "../schemas";

type UpgradeFormProps = Pick<
  CheckoutRequest,
  "organizationId" | "planName" | "billingInterval"
> & {
  locale: string;
  errors: ActionErrorMessages;
};

export function UpgradeForm({
  planName,
  organizationId,
  billingInterval,
  locale,
  errors,
}: UpgradeFormProps) {
  const boundAction = startCheckoutAction.bind(null, {
    organizationId,
    planName,
    billingInterval,
    locale,
  });

  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(boundAction, null);

  useEffect(() => {
    if (state && !state.success && state.error) {
      toast.error(errors.startCheckout, { description: state.error });
    }
  }, [state, errors.startCheckout]);

  return (
    <form action={formAction}>
      <Button className="w-full" disabled={isPending} type="submit">
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
    </form>
  );
}
