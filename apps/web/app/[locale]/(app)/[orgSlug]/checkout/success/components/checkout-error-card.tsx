import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import type { VerificationFailureReason } from "../verify-session";

interface CheckoutErrorCardProps {
  readonly reason: VerificationFailureReason;
  readonly billingHref: string;
}

const ERROR_MESSAGES: Record<VerificationFailureReason, string> = {
  missing_session:
    "We couldn't find a checkout session. If you completed a payment, please refresh your billing page.",
  not_paid:
    "This checkout session hasn't been paid yet. If you just completed payment, it can take a moment to confirm.",
  wrong_org: "This checkout session doesn't belong to this organization.",
  stripe_error:
    "We couldn't verify your checkout session with Stripe. Please contact support if this persists.",
};

export function CheckoutErrorCard({
  reason,
  billingHref,
}: CheckoutErrorCardProps) {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
          <AlertCircle className="h-10 w-10 text-yellow-600" />
        </div>
        <CardTitle className="text-2xl">
          Checkout could not be confirmed
        </CardTitle>
        <CardDescription>{ERROR_MESSAGES[reason]}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href={billingHref}>Back to Billing</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
