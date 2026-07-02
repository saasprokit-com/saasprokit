"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import { XCircle } from "lucide-react";
import Link from "next/link";

const getErrorMessage = (error: string | null): string => {
  if (error === "expired") {
    return "This magic link has expired. Please request a new one.";
  }
  if (error === "invalid") {
    return "This magic link is invalid. Please request a new one.";
  }
  return "An error occurred. Please try again.";
};

export interface MagicLinkErrorCardProps {
  className?: string;
  error?: string | null;
  signInUrl?: string;
}

export function MagicLinkErrorCard({
  error = null,
  signInUrl = "/auth/sign-in",
  className,
}: MagicLinkErrorCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-8 shadow-sm", className)}>
      <div className="mb-6 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-8 w-8 text-destructive" />
        </div>
      </div>

      <div className="mb-6 text-center">
        <h2 className="font-semibold text-2xl">Magic Link Failed</h2>
        <p className="mt-2 text-muted-foreground">{getErrorMessage(error)}</p>
      </div>

      <div className="flex flex-col gap-3">
        <Button asChild className="w-full">
          <Link href={signInUrl}>Back to Sign In</Link>
        </Button>
      </div>
    </div>
  );
}
