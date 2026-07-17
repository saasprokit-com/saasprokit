"use client";

import {
  ForgotPasswordForm,
  type ForgotPasswordFormValues,
} from "@repo/design-system/components/molecules/auth/forgot-password-form";
import { ForgotPasswordSuccess } from "@repo/design-system/components/molecules/auth/forgot-password-success";
import type { ActionErrorMessages } from "@repo/internationalization";
import { useState } from "react";
import { requestPasswordResetAction } from "../actions";

interface ForgotPasswordClientProps {
  errors: ActionErrorMessages;
}

export function ForgotPasswordClient({ errors }: ForgotPasswordClientProps) {
  const [success, setSuccess] = useState(false);

  async function handleSubmit(data: ForgotPasswordFormValues) {
    const result = await requestPasswordResetAction(data);

    if (!result.success) {
      throw new Error(result.error || errors.sendResetEmail);
    }

    setSuccess(true);
  }

  if (success) {
    return <ForgotPasswordSuccess />;
  }

  return <ForgotPasswordForm onSubmit={handleSubmit} />;
}
