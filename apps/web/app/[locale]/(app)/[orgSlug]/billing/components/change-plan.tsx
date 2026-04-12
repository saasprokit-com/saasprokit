"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Switch } from "@repo/design-system/components/ui/switch";
import type { ActionErrorMessages } from "@repo/internationalization";
import { MONTHS_PER_YEAR } from "@repo/utils/date";
import {
  type BillingInterval,
  PLAN_DISPLAY_NAMES,
  PLAN_NAMES,
  type PlanName,
  PRICING,
} from "@repo/utils/payment";
import { useSubscription } from "@repo/payment/hooks";
import {
  comparePlans,
  getAllPlans,
  getAnnualSavingsPercent,
  getMonthlyFromAnnual,
} from "@repo/payment/plans";
import { CheckCircle2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { DowngradeButton } from "./downgrade-button";
import { UpgradeForm } from "./upgrade-form";

type ChangePlanProps = {
  errors: ActionErrorMessages;
  organizationId: string;
};

export function ChangePlan({ errors, organizationId }: ChangePlanProps) {
  const { locale } = useParams<{ locale: string }>();
  const { planName: currentPlan, refetch } = useSubscription();
  const [billingPeriod, setBillingPeriod] =
    useState<BillingInterval>("monthly");

  const handleDowngradeSuccess = useCallback(
    (action: "cancel" | "changed") => {
      if (action === "cancel") {
        toast.info("To downgrade to Free, cancel your subscription below.");
      } else {
        toast.success("Plan changed successfully");
        refetch();
      }
    },
    [refetch]
  );

  const plans = getAllPlans();
  const savingsPercent = getAnnualSavingsPercent(PLAN_NAMES.PRO);

  const getPrice = (planName: PlanName) => {
    const key = planName.toUpperCase();
    const pricing =
      key in PRICING ? PRICING[key as keyof typeof PRICING] : null;
    if (!pricing) {
      return 0;
    }
    if (billingPeriod === "yearly") {
      return getMonthlyFromAnnual(pricing.YEARLY);
    }
    return pricing.MONTHLY;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Change Plan</CardTitle>
            <CardDescription>
              Compare plans and change your subscription
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-sm ${
                billingPeriod === "monthly"
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Monthly
            </span>
            <Switch
              checked={billingPeriod === "yearly"}
              onCheckedChange={(checked) =>
                setBillingPeriod(checked ? "yearly" : "monthly")
              }
            />
            <span
              className={`flex items-center gap-2 text-sm ${
                billingPeriod === "yearly"
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Annual
              {savingsPercent > 0 && (
                <Badge variant="secondary">Save {savingsPercent}%</Badge>
              )}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const direction = comparePlans(currentPlan, plan.name);
            const isCurrent = direction === "same";
            const isUpgrade = direction === "upgrade";
            const isDowngrade = direction === "downgrade";
            const price = getPrice(plan.name);

            return (
              <Card
                className={
                  isCurrent ? "border-primary bg-primary/5" : undefined
                }
                key={plan.name}
              >
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-lg">
                      {PLAN_DISPLAY_NAMES[plan.name]}
                    </h3>
                    {isCurrent && <Badge variant="default">Current Plan</Badge>}
                  </div>

                  <p className="mb-2 text-muted-foreground text-sm">
                    {plan.description}
                  </p>

                  <div className="mb-4">
                    <span className="font-bold text-2xl">
                      {price === 0 ? "Free" : `$${price}/mo`}
                    </span>
                    {billingPeriod === "yearly" && price > 0 && (
                      <p className="mt-1 text-muted-foreground text-xs">
                        Billed annually ($
                        {(price * MONTHS_PER_YEAR).toFixed(0)}
                        /year)
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

                  {isUpgrade &&
                    (plan.name === "pro" || plan.name === "enterprise") && (
                      <UpgradeForm
                        billingInterval={billingPeriod}
                        errors={errors}
                        locale={locale || "en"}
                        organizationId={organizationId}
                        planName={plan.name}
                      />
                    )}

                  {isDowngrade && (
                    <DowngradeButton
                      billingInterval={billingPeriod}
                      currentPlan={currentPlan}
                      errors={errors}
                      onSuccess={handleDowngradeSuccess}
                      organizationId={organizationId}
                      planName={plan.name}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
