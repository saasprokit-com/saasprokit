"use client";

import { authClient } from "@repo/auth/client";
import {
  ForgotPasswordForm,
  type ForgotPasswordFormValues,
} from "@repo/design-system/components/molecules/auth/forgot-password-form";
import { ForgotPasswordSuccess } from "@repo/design-system/components/molecules/auth/forgot-password-success";
import type { ActionErrorMessages } from "@repo/internationalization";
import { useState } from "react";
import { PAGE_ROUTES } from "@/lib/routes";

interface ForgotPasswordClientProps {
  errors: ActionErrorMessages;
}

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

    setSuccess(true);
  }

  if (success) {
    return <ForgotPasswordSuccess />;
  }

  return <ForgotPasswordForm onSubmit={handleSubmit} />;
}
