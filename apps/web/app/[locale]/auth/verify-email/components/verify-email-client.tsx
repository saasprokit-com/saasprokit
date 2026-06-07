"use client";

import { authClient } from "@repo/auth/client";
import { VerifyEmailCard } from "@repo/design-system/components/molecules/auth/verify-email-card";
import type { ActionErrorMessages } from "@repo/internationalization";
import { useCallback, useEffect, useState, useTransition } from "react";
import { PAGE_ROUTES } from "@/lib/routes";

const RESEND_COOLDOWN_SECONDS = 60;
const COUNTDOWN_INTERVAL_MS = 1000;

interface VerifyEmailClientProps {
  email: string | null;
  errors: ActionErrorMessages;
}

export function VerifyEmailClient({ email, errors }: VerifyEmailClientProps) {
  const [isResending, startResendTransition] = useTransition();
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setTimeout(
      () => setCooldown((c) => c - 1),
      COUNTDOWN_INTERVAL_MS
    );
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = useCallback(() => {
    if (!email || cooldown > 0) {
      return;
    }

    setResendError(null);
    setResendSuccess(false);

    startResendTransition(async () => {
      try {
        const { error } = await authClient.sendVerificationEmail({
          email,
          callbackURL: PAGE_ROUTES.ORG,
        });
        if (error) {
          setResendError(error.message || errors.resendVerificationEmail);
          return;
        }
        setResendSuccess(true);
        setCooldown(RESEND_COOLDOWN_SECONDS);
      } catch {
        setResendError(errors.resendVerificationEmail);
      }
    });
  }, [email, cooldown, errors.resendVerificationEmail]);

  return (
    <VerifyEmailCard
      cooldown={cooldown}
      email={email}
      isResending={isResending}
      onResend={handleResend}
      resendError={resendError}
      resendSuccess={resendSuccess}
    />
  );
}
