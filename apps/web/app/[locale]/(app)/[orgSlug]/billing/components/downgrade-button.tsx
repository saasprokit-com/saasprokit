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
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { changePlanAction } from "../actions";

interface DowngradeButtonProps {
  billingInterval: BillingInterval;
  blockReason?: string;
  currentPlan: PlanName;
  errors: ActionErrorMessages;
  onSuccess?: (action: "cancel" | "changed") => void;
  organizationId: string;
  planName: PlanName;
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
  const [serverBlockReason, setServerBlockReason] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const handleDowngrade = () => {
    startTransition(async () => {
      const result = await changePlanAction({
        organizationId,
        targetPlan: planName,
        billingInterval,
      });

      if (!result.success) {
        toast.error(errors.changePlan, { description: result.error });
        setOpen(false);
        return;
      }

      if (result.data?.blockReason) {
        // Keep dialog open to show block reason
        setServerBlockReason(result.data.blockReason);
        return;
      }

      setOpen(false);
      if (result.data) {
        onSuccess?.(result.data.action);
      }
    });
  };

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
          <Button
            disabled={isPending || !!serverBlockReason}
            onClick={handleDowngrade}
            type="button"
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
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
