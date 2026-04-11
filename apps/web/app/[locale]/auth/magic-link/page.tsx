"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { SuspenseFallback } from "@repo/design-system/components/ui/suspense-fallback";
import { CheckCircle, Mail, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const getErrorMessage = (error: string | null): string => {
  if (error === "expired") {
    return "This magic link has expired. Please request a new one.";
  }
  if (error === "invalid") {
    return "This magic link is invalid. Please request a new one.";
  }
  return "An error occurred. Please try again.";
};

function MagicLinkContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (error) {
    return (
      <div className="rounded-lg border bg-card p-8 shadow-sm">
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
            <Link href="/auth/sign-in">Back to Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  // If no error, show a "check your email" message (user lands here after requesting magic link)
  return (
    <div className="rounded-lg border bg-card p-8 shadow-sm">
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
        <Link className="text-primary hover:underline" href="/auth/sign-in">
          Try again
        </Link>
      </p>
    </div>
  );
}

export default function MagicLinkPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <Suspense fallback={<SuspenseFallback />}>
          <MagicLinkContent />
        </Suspense>
      </div>
    </main>
  );
}
