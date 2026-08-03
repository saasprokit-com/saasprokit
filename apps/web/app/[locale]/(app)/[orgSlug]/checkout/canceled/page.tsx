import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { XCircle } from "lucide-react";
import Link from "next/link";
import { buildLocalePath } from "@/lib/infrastructure/revalidation";
import { getActiveOrganization } from "@/lib/organization/queries";
import { orgRoutes } from "@/lib/routes";
import { SUPPORT_EMAIL_HREF } from "../support-email";

interface Props {
  params: Promise<{ locale: string; orgSlug: string }>;
}

export default async function CheckoutCanceledPage({ params }: Props) {
  const { locale, orgSlug } = await params;

  await getActiveOrganization(orgSlug);
  const billingHref = buildLocalePath(locale, orgRoutes.billing(orgSlug));

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <XCircle className="h-10 w-10 text-gray-600" />
            </div>
            <CardTitle className="text-2xl">Checkout Canceled</CardTitle>
            <CardDescription>
              You've canceled the checkout process. No charges were made.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground text-sm">
              If you encountered any issues or have questions, please don't
              hesitate to reach out to our support team.
            </p>

            <div className="flex gap-3">
              <Button asChild className="flex-1">
                <Link href={billingHref}>Try Again</Link>
              </Button>
              <Button asChild className="flex-1" variant="outline">
                <Link href={SUPPORT_EMAIL_HREF}>Contact Support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
