"use client";

import { authClient } from "@repo/auth/client";
import { Button } from "@repo/design-system/components/ui/button";
import type { ActionErrorMessages } from "@repo/internationalization";
import { KeyRound, Mail, RefreshCw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { PAGE_ROUTES } from "@/lib/routes";

const RESEND_COOLDOWN_SECONDS = 60;
const COUNTDOWN_INTERVAL_MS = 1000;

type VerifyEmailClientProps = {
  errors: ActionErrorMessages;
};

export function VerifyEmailClient({ errors }: VerifyEmailClientProps) {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [isResending, startResendTransition] = useTransition();
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setTimeout(
      () => setCooldown((c) => c - 1),
      COUNTDOWN_INTERVAL_MS
    );
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = useCallback(() => {
    if (!email || cooldown > 0) {
      return;
    }

    setResendError(null);
    setResendSuccess(false);

    startResendTransition(async () => {
      try {
        await authClient.sendVerificationEmail({
          email,
          callbackURL: PAGE_ROUTES.ORG,
        });
        setResendSuccess(true);
        setCooldown(RESEND_COOLDOWN_SECONDS);
      } catch {
        setResendError(errors.resendVerificationEmail);
      }
    });
  }, [email, cooldown, errors.resendVerificationEmail]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-semibold text-2xl">Check your email</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            We&apos;ve sent a verification link to{" "}
            {email ? (
              <span className="font-medium text-foreground">{email}</span>
            ) : (
              "your email address"
            )}
            . Please check your inbox and click the link to verify.
          </p>
        </div>

        {email && (
          <div className="mt-6 space-y-3">
            {resendSuccess && (
              <div className="rounded-md bg-green-100 p-3 text-center text-green-800 text-sm dark:bg-green-900/30 dark:text-green-400">
                Verification email resent!
              </div>
            )}

            {resendError && (
              <div className="rounded-md bg-destructive/10 p-3 text-center text-destructive text-sm">
                {resendError}
              </div>
            )}

            <Button
              className="w-full"
              disabled={isResending || cooldown > 0}
              onClick={handleResend}
              variant="outline"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isResending ? "animate-spin" : ""}`}
              />
              {isResending && "Sending..."}
              {!isResending && cooldown > 0 && `Resend in ${cooldown}s`}
              {!isResending && cooldown <= 0 && "Resend verification email"}
            </Button>
          </div>
        )}

        <div className="mt-6 border-t pt-6">
          <p className="mb-3 text-center text-muted-foreground text-xs">
            Or sign in with an alternative method
          </p>
          <div className="flex gap-2">
            <Button asChild className="flex-1" size="sm" variant="outline">
              <Link href={`${PAGE_ROUTES.SIGN_IN}?tab=magic-link`}>
                <Sparkles className="mr-2 h-4 w-4" />
                Magic Link
              </Link>
            </Button>
            <Button asChild className="flex-1" size="sm" variant="outline">
              <Link href={`${PAGE_ROUTES.SIGN_IN}?tab=otp`}>
                <KeyRound className="mr-2 h-4 w-4" />
                Email OTP
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link
            className="text-muted-foreground text-sm hover:text-foreground hover:underline"
            href={PAGE_ROUTES.SIGN_IN}
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
