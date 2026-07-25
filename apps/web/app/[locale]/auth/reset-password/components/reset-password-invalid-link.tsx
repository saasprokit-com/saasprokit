import { Button } from "@repo/design-system/components/ui/button";
import Link from "next/link";
import { PAGE_ROUTES } from "@/lib/routes";

export function ResetPasswordInvalidLink() {
  return (
    <div className="text-center">
      <h1 className="font-semibold text-2xl">Invalid Reset Link</h1>
      <p className="mt-2 text-muted-foreground">
        This password reset link is invalid or has expired.
      </p>
      <Button asChild className="mt-4">
        <Link href={PAGE_ROUTES.FORGOT_PASSWORD}>Request a new reset link</Link>
      </Button>
    </div>
  );
}
