"use client";

import { cn } from "@repo/design-system/lib/utils";
import { CheckCircle, Mail } from "lucide-react";
import Link from "next/link";

export interface MagicLinkSentCardProps {
  signInUrl?: string;
  className?: string;
}

export function MagicLinkSentCard({
  signInUrl = "/auth/sign-in",
  className,
}: MagicLinkSentCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-8 shadow-sm", className)}>
      <div className="mb-6 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
      </div>

      <div className="mb-6 text-center">
        <h2 className="font-semibold text-2xl">Check Your Email</h2>
        <p className="mt-2 text-muted-foreground">
          We&apos;ve sent you a magic link. Click the link in your email to sign
          in.
        </p>
      </div>

      <div className="rounded-md bg-muted p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
          <div className="text-sm">
            <p className="font-medium">Link sent successfully</p>
            <p className="mt-1 text-muted-foreground">
              The link will expire in 10 minutes. If you don&apos;t see the
              email, check your spam folder.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-muted-foreground text-sm">
        Didn&apos;t receive the email?{" "}
        <Link className="text-primary hover:underline" href={signInUrl}>
          Try again
        </Link>
      </p>
    </div>
  );
}
