import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { CheckoutRefreshButton } from "./checkout-refresh-button";

interface CheckoutProcessingCardProps {
  readonly billingHref: string;
}

/**
 * Shown when the Stripe Checkout session exists and looks complete but the
 * payment is not yet marked `paid` (or the BA webhook hasn't written the
 * Subscription row yet). Most users land here for ~1-3s during the webhook
 * race — rendering it as a hard error would be misleading.
 */
export function CheckoutProcessingCard({
  billingHref,
}: CheckoutProcessingCardProps) {
  return (
    <Card>
      <CardHeader className="text-center">
        <output
          aria-label="Processing"
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100"
        >
          <Loader2
            aria-hidden="true"
            className="h-10 w-10 animate-spin text-blue-600"
          />
        </output>
        <CardTitle className="text-2xl">
          Finalizing your subscription...
        </CardTitle>
        <CardDescription>
          Your payment was accepted. We're confirming it with Stripe — this
          usually takes a few seconds.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row">
          <CheckoutRefreshButton />
          <Button asChild className="flex-1" variant="outline">
            <Link href={billingHref}>Go to Billing</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
