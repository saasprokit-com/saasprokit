"use client";

import { authClient } from "@repo/auth/client";
import {
  ResetPasswordForm,
  type ResetPasswordFormValues,
} from "@repo/design-system/components/molecules/auth/reset-password-form";
import { ResetPasswordInvalidLink } from "@repo/design-system/components/molecules/auth/reset-password-invalid-link";
import { ResetPasswordSuccess } from "@repo/design-system/components/molecules/auth/reset-password-success";
import type { ActionErrorMessages } from "@repo/internationalization";
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
    return <ResetPasswordInvalidLink />;
  }

  if (success) {
    return <ResetPasswordSuccess />;
  }

  return <ResetPasswordForm onSubmit={handleSubmit} />;
}
