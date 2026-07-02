"use client";

import Link from "next/link";
import { AuthCard } from "./auth-card";

export interface ResetPasswordSuccessProps {
  className?: string;
  signInUrl?: string;
}

export function ResetPasswordSuccess({
  signInUrl = "/auth/sign-in",
  className,
}: ResetPasswordSuccessProps) {
  return (
    <AuthCard
      className={className}
      description="Your password has been updated"
      footer={
        <Link className="text-primary text-sm hover:underline" href={signInUrl}>
          Sign in with your new password
        </Link>
      }
      title="Password Reset Successfully"
    >
      <div className="text-center text-muted-foreground text-sm">
        <p>Your password has been successfully reset.</p>
        <p className="mt-2">You can now sign in with your new password.</p>
      </div>
    </AuthCard>
  );
}
