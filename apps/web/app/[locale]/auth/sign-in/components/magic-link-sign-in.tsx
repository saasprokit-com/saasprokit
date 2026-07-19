"use client";

import {
  MagicLinkForm,
  type MagicLinkFormValues,
} from "@repo/design-system/components/molecules/auth/magic-link-form";
import { MagicLinkSentCard } from "@repo/design-system/components/molecules/auth/magic-link-sent-card";
import type { ActionErrorMessages } from "@repo/internationalization";
import { useState } from "react";
import { signInMagicLinkAction } from "../actions";

interface MagicLinkSignInProps {
  errors: ActionErrorMessages;
}

export function MagicLinkSignIn({ errors }: MagicLinkSignInProps) {
  const [success, setSuccess] = useState(false);

  async function handleSubmit(data: MagicLinkFormValues) {
    const result = await signInMagicLinkAction(data);

    if (!result.success) {
      throw new Error(result.error || errors.sendMagicLink);
    }

    setSuccess(true);
  }

  if (success) {
    return <MagicLinkSentCard />;
  }

  return <MagicLinkForm onSubmit={handleSubmit} />;
}
