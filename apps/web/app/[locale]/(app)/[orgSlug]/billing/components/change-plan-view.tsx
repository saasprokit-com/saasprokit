"use client";

import { getCurrentPlan } from "@repo/auth/helpers";
import { getAllPlans, getAnnualSavingsPercent } from "@repo/auth/plans";
import type { Subscription } from "@repo/database";
import { Badge } from "@repo/design-system/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Switch } from "@repo/design-system/components/ui/switch";
import type { ActionErrorMessages } from "@repo/internationalization";
import { type BillingInterval, PLAN_NAMES } from "@repo/utils/payment";
import { useState } from "react";
import { toast } from "sonner";
import { PlanCard } from "./plan-card";

interface ChangePlanViewProps {
  errors: ActionErrorMessages;
  locale: string;
  organizationId: string;
  organizationSlug: string;
  subscription: Subscription | null;
}

export function ChangePlanView({
  errors,
  locale,
  organizationId,
  organizationSlug,
  subscription,
}: ChangePlanViewProps) {
  const currentPlan = getCurrentPlan(subscription);

  const [billingPeriod, setBillingPeriod] =
    useState<BillingInterval>("monthly");

  const handleDowngradeSuccess = (action: "cancel" | "changed") => {
    if (action === "cancel") {
      toast.info("To downgrade to Free, cancel your subscription below.");
    } else {
      toast.success("Plan changed successfully");
    }
  };

  const plans = getAllPlans();
  const savingsPercent = getAnnualSavingsPercent(PLAN_NAMES.PRO);

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
          {plans.map((plan) => (
            <PlanCard
              billingPeriod={billingPeriod}
              currentPlan={currentPlan}
              errors={errors}
              key={plan.name}
              locale={locale}
              onDowngradeSuccess={handleDowngradeSuccess}
              organizationId={organizationId}
              organizationSlug={organizationSlug}
              plan={plan}
              subscription={subscription}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
