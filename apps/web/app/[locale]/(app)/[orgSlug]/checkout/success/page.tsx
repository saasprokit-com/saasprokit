import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: Props) {
  const { locale, orgSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const sessionId = resolvedSearchParams.session_id;

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Subscription Activated!</CardTitle>
            <CardDescription>
              Your payment was successful and your subscription is now active.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {sessionId && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-muted-foreground text-sm">
                  Session ID:{" "}
                  <code className="font-mono text-xs">{sessionId}</code>
                </p>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                You'll receive a confirmation email shortly. Your subscription
                includes:
              </p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground text-sm">
                <li>Access to all premium features</li>
                <li>Priority support</li>
                <li>Cancel anytime</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button asChild className="flex-1">
                <Link href={`/${locale}/${orgSlug}`}>Go to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
