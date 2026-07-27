"use client";

import {
  isSubscriptionActive,
  isSubscriptionPendingCancel,
} from "@repo/auth/helpers";
import type { Subscription } from "@repo/database";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/design-system/components/ui/alert-dialog";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import type { ActionErrorMessages } from "@repo/internationalization";
import { PLAN_NAMES, type PlanName } from "@repo/utils/payment";
import { Loader2, XCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cancelSubscriptionAction } from "../actions";
import { ManageBillingForm } from "./manage-billing-form";

interface BillingActionsProps {
  errors: ActionErrorMessages;
  organizationId: string;
  organizationSlug: string;
  planName: PlanName;
  subscription: Subscription | null;
}

export function BillingActions({
  errors,
  organizationId,
  organizationSlug,
  planName,
  subscription,
}: BillingActionsProps) {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCanceling, startTransition] = useTransition();

  const isActive = isSubscriptionActive(subscription);
  const isPaid = isActive && planName !== PLAN_NAMES.FREE;
  const isCanceled = isActive && isSubscriptionPendingCancel(subscription);

  const handleCancelSubscription = () => {
    startTransition(async () => {
      const result = await cancelSubscriptionAction({
        organizationId,
        organizationSlug,
        locale,
        subscriptionId: subscription?.stripeSubscriptionId ?? undefined,
      });

      // Stripe confirms cancellation via its hosted portal — redirect there.
      if (result.success && result.data?.url) {
        window.location.href = result.data.url;
        return;
      }

      if (result.success) {
        // Immediate cancel (or benign already-canceling) — settle the UI.
        startTransition(() => {
          setShowCancelDialog(false);
        });
        toast.success("Subscription canceled", {
          description:
            "Your subscription will end at the current billing period.",
        });
        router.refresh();
        return;
      }

      toast.error(errors.cancelSubscription, { description: result.error });
    });
  };

  // Don't show billing actions on free plan
  if (planName === PLAN_NAMES.FREE) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Actions</CardTitle>
        <CardDescription>
          Manage your subscription and payment methods
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <ManageBillingForm
            errors={errors}
            locale={locale}
            organizationId={organizationId}
            organizationSlug={organizationSlug}
          />

          {isPaid && !isCanceled && (
            <AlertDialog
              onOpenChange={setShowCancelDialog}
              open={showCancelDialog}
            >
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Subscription
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your subscription will remain active until the end of the
                    current billing period. After that, you'll be downgraded to
                    the Free plan and lose access to paid features.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={isCanceling}
                    onClick={(e) => {
                      e.preventDefault();
                      handleCancelSubscription();
                    }}
                  >
                    {isCanceling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Canceling...
                      </>
                    ) : (
                      "Yes, Cancel"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {isCanceled && (
          <p className="text-muted-foreground text-sm">
            Your subscription has been canceled and will end at the current
            billing period. You can reactivate it from the billing portal.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
