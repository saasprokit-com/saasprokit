"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import { KeyRound, Mail, RefreshCw, Sparkles } from "lucide-react";
import Link from "next/link";

export interface VerifyEmailCardProps {
  email: string | null;
  isResending: boolean;
  resendSuccess: boolean;
  resendError?: string | null;
  cooldown: number;
  onResend: () => void;
  signInUrl?: string;
  magicLinkUrl?: string;
  otpUrl?: string;
  className?: string;
}

export function VerifyEmailCard({
  email,
  isResending,
  resendSuccess,
  resendError,
  cooldown,
  onResend,
  signInUrl = "/auth/sign-in",
  magicLinkUrl = "/auth/sign-in?tab=magic-link",
  otpUrl = "/auth/sign-in?tab=otp",
  className,
}: VerifyEmailCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-lg border bg-card p-8 shadow-sm",
        className
      )}
    >
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
            onClick={onResend}
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
            <Link href={magicLinkUrl}>
              <Sparkles className="mr-2 h-4 w-4" />
              Magic Link
            </Link>
          </Button>
          <Button asChild className="flex-1" size="sm" variant="outline">
            <Link href={otpUrl}>
              <KeyRound className="mr-2 h-4 w-4" />
              Email OTP
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-4 text-center">
        <Link
          className="text-muted-foreground text-sm hover:text-foreground hover:underline"
          href={signInUrl}
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
