"use client";

import {
  ResetPasswordForm,
  type ResetPasswordFormValues,
} from "@repo/design-system/components/molecules/auth/reset-password-form";
import { ResetPasswordInvalidLink } from "@repo/design-system/components/molecules/auth/reset-password-invalid-link";
import { ResetPasswordSuccess } from "@repo/design-system/components/molecules/auth/reset-password-success";
import type { ActionErrorMessages } from "@repo/internationalization";
import { useState } from "react";
import { resetPasswordAction } from "../actions";

interface ResetPasswordClientProps {
  errors: ActionErrorMessages;
  token?: string;
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

    const result = await resetPasswordAction({
      token,
      newPassword: data.password,
    });

    if (!result.success) {
      throw new Error(result.error || errors.resetPassword);
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
