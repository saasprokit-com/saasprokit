"use client";

import { authClient } from "@repo/auth/client";
import {
  ForgotPasswordForm,
  type ForgotPasswordFormValues,
} from "@repo/design-system/components/molecules/auth/forgot-password-form";
import type { ActionErrorMessages } from "@repo/internationalization";
import { useState } from "react";
import { PAGE_ROUTES } from "@/lib/routes";
import { logResetRequestAction } from "./actions";

type ForgotPasswordClientProps = {
  errors: ActionErrorMessages;
};

export function ForgotPasswordClient({ errors }: ForgotPasswordClientProps) {
  const [success, setSuccess] = useState(false);

  async function handleSubmit(data: ForgotPasswordFormValues) {
    const { error } = await authClient.requestPasswordReset({
      email: data.email,
      redirectTo: PAGE_ROUTES.RESET_PASSWORD,
    });

    if (error) {
      throw new Error(error.message || errors.sendResetEmail);
    }

    await logResetRequestAction(data.email);

    setSuccess(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <ForgotPasswordForm onSubmit={handleSubmit} success={success} />
    </main>
  );
}
