import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { PLANS } from "@repo/payment/plans";
import type { PlanName } from "@repo/utils/payment";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

interface CheckoutSuccessCardProps {
  readonly billingHref: string;
  readonly dashboardHref: string;
  readonly planName: PlanName;
}

export function CheckoutSuccessCard({
  billingHref,
  dashboardHref,
  planName,
}: CheckoutSuccessCardProps) {
  const plan = PLANS[planName];

  return (
    <Card>
      <CardHeader className="text-center">
        <output
          aria-label="Success"
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
        >
          <CheckCircle
            aria-hidden="true"
            className="h-10 w-10 text-green-600"
          />
        </output>
        <CardTitle className="text-2xl">
          You're on the {plan.displayName} plan
        </CardTitle>
        <CardDescription>
          Your payment was successful and your subscription is now active.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            You'll receive a confirmation email shortly. Your {plan.displayName}{" "}
            plan includes:
          </p>
          <ul className="list-inside list-disc space-y-1 text-muted-foreground text-sm">
            {plan.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1" variant="outline">
            <Link href={dashboardHref}>Go to Dashboard</Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href={billingHref}>View Billing</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
