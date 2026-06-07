"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import Link from "next/link";

export interface ResetPasswordInvalidLinkProps {
  forgotPasswordUrl?: string;
  className?: string;
}

export function ResetPasswordInvalidLink({
  forgotPasswordUrl = "/auth/forgot-password",
  className,
}: ResetPasswordInvalidLinkProps) {
  return (
    <div className={cn("text-center", className)}>
      <h1 className="font-semibold text-2xl">Invalid Reset Link</h1>
      <p className="mt-2 text-muted-foreground">
        This password reset link is invalid or has expired.
      </p>
      <Button asChild className="mt-4">
        <Link href={forgotPasswordUrl}>Request a new reset link</Link>
      </Button>
    </div>
  );
}
