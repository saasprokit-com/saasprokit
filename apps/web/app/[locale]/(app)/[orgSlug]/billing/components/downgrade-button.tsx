"use client";

import {
  Alert,
  AlertDescription,
} from "@repo/design-system/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/design-system/components/ui/alert-dialog";
import { Button } from "@repo/design-system/components/ui/button";
import type { ActionErrorMessages } from "@repo/internationalization";
import {
  type BillingInterval,
  PLAN_DISPLAY_NAMES,
  type PlanName,
} from "@repo/utils/payment";
import { AlertTriangle, ArrowDown, Loader2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/auth/auth";
import { type ChangePlanResult, changePlanAction } from "../actions";

interface DowngradeButtonProps {
  planName: PlanName;
  currentPlan: PlanName;
  organizationId: string;
  billingInterval: BillingInterval;
  errors: ActionErrorMessages;
  blockReason?: string;
  onSuccess?: (action: "cancel" | "changed") => void;
}

export function DowngradeButton({
  planName,
  currentPlan,
  organizationId,
  billingInterval,
  errors,
  blockReason,
  onSuccess,
}: DowngradeButtonProps) {
  const [open, setOpen] = useState(false);

  const boundAction = changePlanAction.bind(null, {
    organizationId,
    targetPlan: planName,
    billingInterval,
  });

  const [state, formAction, isPending] = useActionState<
    ActionResult<ChangePlanResult> | null,
    FormData
  >(boundAction, null);

  const serverBlockReason = state?.success ? state.data?.blockReason : undefined;

  useEffect(() => {
    if (!state) {
      return;
    }

    if (!state.success && state.error) {
      toast.error(errors.changePlan, { description: state.error });
      setOpen(false);
      return;
    }

    if (state.success && state.data) {
      if (state.data.blockReason) {
        // Keep dialog open to show block reason
        return;
      }
      setOpen(false);
      onSuccess?.(state.data.action);
    }
  }, [state, errors.changePlan, onSuccess]);

  if (blockReason) {
    return (
      <div className="space-y-2">
        <Button className="w-full" disabled variant="outline">
          <ArrowDown className="mr-2 h-4 w-4" />
          Downgrade to {PLAN_DISPLAY_NAMES[planName]}
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{blockReason}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogTrigger asChild>
        <Button className="w-full" variant="outline">
          <ArrowDown className="mr-2 h-4 w-4" />
          Downgrade to {PLAN_DISPLAY_NAMES[planName]}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Downgrade to {PLAN_DISPLAY_NAMES[planName]}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            You will lose access to features available on your current{" "}
            {PLAN_DISPLAY_NAMES[currentPlan]} plan. This change takes effect at
            the end of your current billing period.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {serverBlockReason && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{serverBlockReason}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>
            Keep {PLAN_DISPLAY_NAMES[currentPlan]}
          </AlertDialogCancel>
          <form action={formAction}>
            <Button
              className="w-full"
              disabled={isPending || !!serverBlockReason}
              type="submit"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downgrading...
                </>
              ) : (
                "Yes, Downgrade"
              )}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
