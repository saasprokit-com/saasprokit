"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Card, CardContent } from "@repo/design-system/components/ui/card";
import type { ActionErrorMessages } from "@repo/internationalization";
import { guardDowngrade } from "@repo/payment/guards";
import { comparePlans, getMonthlyFromAnnual } from "@repo/payment/plans";
import type { Subscription } from "@repo/payment/types";
import { MONTHS_PER_YEAR } from "@repo/utils/date";
import {
  type BillingInterval,
  PLAN_DISPLAY_NAMES,
  type PlanConfig,
  type PlanName,
  PRICING,
} from "@repo/utils/payment";
import { CheckCircle2 } from "lucide-react";
import { DowngradeButton } from "./downgrade-button";
import { UpgradeForm } from "./upgrade-form";

interface PlanCardProps {
  plan: PlanConfig;
  currentPlan: PlanName;
  billingPeriod: BillingInterval;
  memberCount: number;
  storageMB: number;
  subscription: Subscription | null | undefined;
  organizationId: string;
  organizationSlug: string;
  locale: string;
  errors: ActionErrorMessages;
  onDowngradeSuccess: (action: "cancel" | "changed") => void;
}

function getMonthlyDisplayPrice(
  planName: PlanName,
  billingPeriod: BillingInterval
): number {
  const key = planName.toUpperCase();
  const pricing = key in PRICING ? PRICING[key as keyof typeof PRICING] : null;
  if (!pricing) {
    return 0;
  }
  return billingPeriod === "yearly"
    ? getMonthlyFromAnnual(pricing.YEARLY)
    : pricing.MONTHLY;
}

export function PlanCard({
  plan,
  currentPlan,
  billingPeriod,
  memberCount,
  storageMB,
  subscription,
  organizationId,
  organizationSlug,
  locale,
  errors,
  onDowngradeSuccess,
}: PlanCardProps) {
  const direction = comparePlans(currentPlan, plan.name);
  const isCurrent = direction === "same";
  const isUpgrade = direction === "upgrade";
  const isDowngrade = direction === "downgrade";
  const price = getMonthlyDisplayPrice(plan.name, billingPeriod);
  const downgradeBlockReason = isDowngrade
    ? guardDowngrade(subscription, plan.name, memberCount, storageMB).reason
    : undefined;

  return (
    <Card className={isCurrent ? "border-primary bg-primary/5" : undefined}>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-lg">
            {PLAN_DISPLAY_NAMES[plan.name]}
          </h3>
          {isCurrent && <Badge variant="default">Current Plan</Badge>}
        </div>

        <p className="mb-2 text-muted-foreground text-sm">{plan.description}</p>

        <div className="mb-4">
          <span className="font-bold text-2xl">
            {price === 0 ? "Free" : `$${price}/mo`}
          </span>
          {billingPeriod === "yearly" && price > 0 && (
            <p className="mt-1 text-muted-foreground text-xs">
              Billed annually (${(price * MONTHS_PER_YEAR).toFixed(0)}/year)
            </p>
          )}
        </div>

        <ul className="mb-4 space-y-1 text-sm">
          {plan.features.map((feature) => (
            <li className="flex items-center gap-2" key={feature}>
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        {isCurrent && (
          <Button className="w-full" disabled variant="outline">
            Current Plan
          </Button>
        )}

        {isUpgrade && (plan.name === "pro" || plan.name === "enterprise") && (
          <UpgradeForm
            billingInterval={billingPeriod}
            errors={errors}
            locale={locale}
            organizationId={organizationId}
            organizationSlug={organizationSlug}
            planName={plan.name}
          />
        )}

        {isDowngrade && (
          <DowngradeButton
            billingInterval={billingPeriod}
            blockReason={downgradeBlockReason}
            currentPlan={currentPlan}
            errors={errors}
            onSuccess={onDowngradeSuccess}
            organizationId={organizationId}
            planName={plan.name}
          />
        )}
      </CardContent>
    </Card>
  );
}
