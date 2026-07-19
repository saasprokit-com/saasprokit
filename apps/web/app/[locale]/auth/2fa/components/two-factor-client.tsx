"use client";

import {
  TwoFactorForm,
  type TwoFactorFormValues,
} from "@repo/design-system/components/molecules/auth/two-factor-form";
import type { ActionErrorMessages } from "@repo/internationalization";
import { useRouter } from "next/navigation";
import { PAGE_ROUTES } from "@/lib/routes";
import { verifyTwoFactorAction } from "../actions";

interface TwoFactorClientProps {
  errors: ActionErrorMessages;
}

export function TwoFactorClient({ errors }: TwoFactorClientProps) {
  const router = useRouter();

  async function handleSubmit(data: TwoFactorFormValues) {
    const result = await verifyTwoFactorAction(data);

    if (!result.success) {
      throw new Error(result.error || errors.invalidVerificationCode);
    }

    router.push(PAGE_ROUTES.ORG);
    router.refresh();
  }

  return <TwoFactorForm method="totp" onSubmit={handleSubmit} />;
}
