"use client";

import { authClient } from "@repo/auth/client";
import {
  ResetPasswordForm,
  type ResetPasswordFormValues,
} from "@repo/design-system/components/molecules/auth/reset-password-form";
import { ResetPasswordSuccess } from "@repo/design-system/components/molecules/auth/reset-password-success";
import { Button } from "@repo/design-system/components/ui/button";
import type { ActionErrorMessages } from "@repo/internationalization";
import Link from "next/link";
import { useState } from "react";
import { PAGE_ROUTES } from "@/lib/routes";

interface ResetPasswordClientProps {
  token?: string;
  errors: ActionErrorMessages;
}

export function ResetPasswordClient({
  token,
  errors,
}: ResetPasswordClientProps) {
  const [success, setSuccess] = useState(false);

  async function handleSubmit(data: ResetPasswordFormValues) {
    if (!token) {
      throw new Error(errors.resetPassword);
    }

    const { error } = await authClient.resetPassword({
      newPassword: data.password,
      token,
    });

    if (error) {
      throw new Error(error.message || errors.resetPassword);
    }

    setSuccess(true);
  }

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="font-semibold text-2xl">Invalid Reset Link</h1>
        <p className="mt-2 text-muted-foreground">
          This password reset link is invalid or has expired.
        </p>
        <Button asChild className="mt-4">
          <Link href={PAGE_ROUTES.FORGOT_PASSWORD}>
            Request a new reset link
          </Link>
        </Button>
      </div>
    );
  }

  if (success) {
    return <ResetPasswordSuccess />;
  }

  return <ResetPasswordForm onSubmit={handleSubmit} />;
}
