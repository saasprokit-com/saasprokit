"use client";

import Link from "next/link";
import { AuthCard } from "./auth-card";

export interface MagicLinkSuccessProps {
  className?: string;
  signUpUrl?: string;
}

export function MagicLinkSuccess({
  signUpUrl = "/auth/sign-up",
  className,
}: MagicLinkSuccessProps) {
  return (
    <AuthCard
      className={className}
      description="We've sent you a magic link to sign in"
      footer={
        <p className="text-center text-muted-foreground text-sm">
          Don&apos;t have an account?{" "}
          <Link className="text-primary hover:underline" href={signUpUrl}>
            Sign up
          </Link>
        </p>
      }
      title="Check Your Email"
    >
      <div className="text-center text-muted-foreground text-sm">
        <p>Check your email for the magic link!</p>
        <p className="mt-2">Please check your email inbox and spam folder.</p>
      </div>
    </AuthCard>
  );
}
