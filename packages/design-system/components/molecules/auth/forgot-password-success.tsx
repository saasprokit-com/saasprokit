"use client";

import Link from "next/link";
import { AuthCard } from "./auth-card";

export interface ForgotPasswordSuccessProps {
  className?: string;
  signInUrl?: string;
}

export function ForgotPasswordSuccess({
  signInUrl = "/auth/sign-in",
  className,
}: ForgotPasswordSuccessProps) {
  return (
    <AuthCard
      className={className}
      description="We've sent you a password reset link"
      footer={
        <Link className="text-primary text-sm hover:underline" href={signInUrl}>
          Back to sign in
        </Link>
      }
      title="Check Your Email"
    >
      <div className="text-center text-muted-foreground text-sm">
        <p>
          If an account exists for the email you entered, you will receive a
          password reset link shortly.
        </p>
        <p className="mt-2">Please check your email inbox and spam folder.</p>
      </div>
    </AuthCard>
  );
}
