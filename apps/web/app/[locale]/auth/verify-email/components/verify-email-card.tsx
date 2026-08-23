"use client";

import { Button } from "@repo/design-system/components/ui/button";
import type { ActionErrorMessages } from "@repo/internationalization";
import { KeyRound, Mail, RefreshCw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useActionResult } from "@/hooks/use-action-result";
import type { ActionResult } from "@/lib/auth/auth";
import { PAGE_ROUTES } from "@/lib/routes";
import { resendVerificationEmailFormAction } from "../actions";

const RESEND_COOLDOWN_SECONDS = 60;
const COUNTDOWN_INTERVAL_MS = 1000;

const initialState: ActionResult = { success: false };

interface VerifyEmailCardProps {
  email: string | null;
  errors: ActionErrorMessages;
}

export function VerifyEmailCard({ email, errors }: VerifyEmailCardProps) {
  const [cooldown, setCooldown] = useState(0);
  const [state, formAction, isPending] = useActionState(
    resendVerificationEmailFormAction,
    initialState
  );

  // Pure-UI cooldown countdown, one tick per second.
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

  // Start the cooldown only after a successful resend.
  useActionResult(state, {
    onSuccess: () => setCooldown(RESEND_COOLDOWN_SECONDS),
  });

  const resendError =
    state !== initialState && !state.success
      ? state.error || errors.resendVerificationEmail
      : null;

  return (
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
          {state.success && (
            <div className="rounded-md bg-green-100 p-3 text-center text-green-800 text-sm dark:bg-green-900/30 dark:text-green-400">
              Verification email resent!
            </div>
          )}

          {resendError && (
            <div className="rounded-md bg-destructive/10 p-3 text-center text-destructive text-sm">
              {resendError}
            </div>
          )}

          <form action={formAction}>
            <input name="email" type="hidden" value={email} />
            <Button
              className="w-full"
              disabled={isPending || cooldown > 0}
              type="submit"
              variant="outline"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`}
              />
              {isPending && "Sending..."}
              {!isPending && cooldown > 0 && `Resend in ${cooldown}s`}
              {!isPending && cooldown <= 0 && "Resend verification email"}
            </Button>
          </form>
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
  );
}
