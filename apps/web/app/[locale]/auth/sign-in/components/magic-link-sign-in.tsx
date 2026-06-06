"use client";

import { authClient } from "@repo/auth/client";
import {
  MagicLinkForm,
  type MagicLinkFormValues,
} from "@repo/design-system/components/molecules/auth/magic-link-form";
import type { ActionErrorMessages } from "@repo/internationalization";
import { useState } from "react";
import { PAGE_ROUTES } from "@/lib/routes";

interface MagicLinkSignInProps {
  errors: ActionErrorMessages;
}

export function MagicLinkSignIn({ errors }: MagicLinkSignInProps) {
  const [success, setSuccess] = useState(false);

  async function handleSubmit(data: MagicLinkFormValues) {
    const normalizedEmail = data.email.toLowerCase().trim();

    const result = await authClient.signIn.magicLink({
      email: normalizedEmail,
      callbackURL: PAGE_ROUTES.ORG,
    });

    if (result.error) {
      throw new Error(result.error.message || errors.sendMagicLink);
    }

    setSuccess(true);
  }

  return <MagicLinkForm onSubmit={handleSubmit} success={success} />;
}
