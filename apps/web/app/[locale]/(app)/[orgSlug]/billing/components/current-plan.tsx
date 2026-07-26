"use client";

import { getStatusColor, getStatusDisplayText } from "@repo/auth/helpers";
import { PLANS } from "@repo/auth/plans";
import { useSubscription } from "@repo/auth/use-subscription";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { formatDate } from "@repo/utils/date";
import { PLAN_NAMES, type SubscriptionStatus } from "@repo/utils/payment";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

// Maximum number of features to display in preview
const FEATURE_PREVIEW_COUNT = 4;

function getBadgeVariant(
  statusColor: string
): "default" | "secondary" | "destructive" {
  if (statusColor === "green") {
    return "default";
  }
  if (statusColor === "yellow") {
    return "secondary";
  }
  return "destructive";
}

interface CurrentPlanProps {
  organizationId: string;
}

export function CurrentPlan({ organizationId }: CurrentPlanProps) {
  const {
    subscription,
    planName,
    isLoading,
    error,
    refetch,
    isPaid,
    isActive,
    isCanceled,
  } = useSubscription({ referenceId: organizationId });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Your organization's subscription details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Your organization's subscription details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              Unable to load subscription details.
            </p>
            <Button onClick={() => refetch()} size="sm" variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const plan = PLANS[planName];
  const statusColor = subscription
    ? getStatusColor(subscription.status as SubscriptionStatus)
    : "gray";
  const statusText = subscription
    ? getStatusDisplayText(subscription.status as SubscriptionStatus)
    : "No subscription";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              Your organization's subscription details
            </CardDescription>
          </div>
          <Badge variant={getBadgeVariant(statusColor)}>{statusText}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-2xl">{plan.displayName}</h3>
            <p className="text-muted-foreground text-sm">{plan.description}</p>
          </div>
          {isPaid && isActive && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium text-sm">Active</span>
            </div>
          )}
        </div>

        {isCanceled && subscription?.periodEnd && (
          <div className="flex items-center gap-3 rounded-lg bg-yellow-50 p-4 dark:bg-yellow-950/30">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-sm text-yellow-900 dark:text-yellow-100">
                Your subscription has been canceled
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                You'll retain access until {formatDate(subscription.periodEnd)}
              </p>
            </div>
          </div>
        )}

        {planName === PLAN_NAMES.FREE && (
          <div className="rounded-lg border-2 border-muted-foreground/25 border-dashed p-4 text-center">
            <p className="text-muted-foreground text-sm">
              Upgrade to unlock more features, team members, and storage
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="font-medium text-sm">Features included:</p>
            <ul className="mt-2 space-y-1 text-muted-foreground text-sm">
              {plan.features.slice(0, FEATURE_PREVIEW_COUNT).map((feature) => (
                <li className="flex items-center gap-2" key={feature}>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          {subscription?.periodEnd && isActive && !isCanceled && (
            <div>
              <p className="font-medium text-sm">Billing cycle:</p>
              <p className="mt-2 text-muted-foreground text-sm">
                Next billing date: {formatDate(subscription.periodEnd)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
