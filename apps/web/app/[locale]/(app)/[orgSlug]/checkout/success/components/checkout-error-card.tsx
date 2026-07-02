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
  readonly billingHref: string;
  readonly reason: Exclude<VerificationFailureReason, "not_paid">;
}

const ERROR_MESSAGES: Record<
  Exclude<VerificationFailureReason, "not_paid">,
  string
> = {
  missing_session:
    "We couldn't find a checkout session. If you completed a payment, please refresh your billing page.",
  wrong_org: "This checkout session doesn't belong to this organization.",
  stripe_error:
    "We couldn't verify your checkout session with Stripe. Please contact support if this persists.",
};

const SUPPORT_HREF = "mailto:support@example.com";

export function CheckoutErrorCard({
  reason,
  billingHref,
}: CheckoutErrorCardProps) {
  return (
    <Card>
      <CardHeader className="text-center">
        <div
          aria-label="Error"
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100"
          role="alert"
        >
          <AlertCircle
            aria-hidden="true"
            className="h-10 w-10 text-yellow-600"
          />
        </div>
        <CardTitle className="text-2xl">
          Checkout could not be confirmed
        </CardTitle>
        <CardDescription>{ERROR_MESSAGES[reason]}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1" variant="outline">
            <Link href={billingHref}>Back to Billing</Link>
          </Button>
          {reason === "stripe_error" && (
            <Button asChild className="flex-1">
              <a href={SUPPORT_HREF}>Contact Support</a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
