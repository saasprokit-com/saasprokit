"use client";

import { authClient } from "@repo/auth/client";
import {
  EmailOtpRequestForm,
  type SendOtpFormValues,
} from "@repo/design-system/components/molecules/auth/email-otp-request-form";
import {
  EmailOtpVerifyForm,
  type VerifyOtpFormValues,
} from "@repo/design-system/components/molecules/auth/email-otp-verify-form";
import type { ActionErrorMessages } from "@repo/internationalization";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PAGE_ROUTES } from "@/lib/routes";

interface EmailOtpSignInProps {
  errors: ActionErrorMessages;
}

export function EmailOtpSignIn({ errors }: EmailOtpSignInProps) {
  const router = useRouter();
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState("");

  async function handleSendOtp(data: SendOtpFormValues) {
    const normalizedEmail = data.email.toLowerCase().trim();

    const result = await authClient.emailOtp.sendVerificationOtp({
      email: normalizedEmail,
      type: "sign-in",
    });

    if (result.error) {
      throw new Error(result.error.message || errors.sendOtp);
    }

    setEmail(normalizedEmail);
    setOtpSent(true);
  }

  async function handleVerifyOtp(data: VerifyOtpFormValues) {
    const result = await authClient.signIn.emailOtp({
      email,
      otp: data.code,
    });

    if (result.error) {
      throw new Error(result.error.message || errors.invalidOtp);
    }

    router.push(PAGE_ROUTES.ORG);
    router.refresh();
  }

  function handleUseDifferentEmail() {
    setOtpSent(false);
    setEmail("");
  }

  if (otpSent) {
    return (
      <EmailOtpVerifyForm
        onSubmit={handleVerifyOtp}
        onUseDifferentEmail={handleUseDifferentEmail}
      />
    );
  }

  return <EmailOtpRequestForm onSubmit={handleSendOtp} />;
}
