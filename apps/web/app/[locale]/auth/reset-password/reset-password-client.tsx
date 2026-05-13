"use client";

import { authClient } from "@repo/auth/client";
import {
  ResetPasswordForm,
  type ResetPasswordFormValues,
} from "@repo/design-system/components/molecules/auth/reset-password-form";
import type { ActionErrorMessages } from "@repo/internationalization";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ResetPasswordClientProps {
  token?: string;
  errors: ActionErrorMessages;
}

export function ResetPasswordClient({
  token,
  errors,
}: ResetPasswordClientProps) {
  const [success, setSuccess] = useState(false);
  const router = useRouter();

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
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="font-semibold text-2xl">Invalid Reset Link</h1>
          <p className="mt-2 text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
          <button
            className="mt-4 text-primary hover:underline"
            onClick={() => router.push("/auth/forgot-password")}
            type="button"
          >
            Request a new reset link
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <ResetPasswordForm onSubmit={handleSubmit} success={success} />
    </main>
  );
}
