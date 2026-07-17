"use client";

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
import { sendSignInOtpAction, verifySignInOtpAction } from "../actions";

interface EmailOtpSignInProps {
  errors: ActionErrorMessages;
}

export function EmailOtpSignIn({ errors }: EmailOtpSignInProps) {
  const router = useRouter();
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState("");

  async function handleSendOtp(data: SendOtpFormValues) {
    const result = await sendSignInOtpAction(data);

    if (!result.success) {
      throw new Error(result.error || errors.sendOtp);
    }

    setEmail(data.email.toLowerCase().trim());
    setOtpSent(true);
  }

  async function handleVerifyOtp(data: VerifyOtpFormValues) {
    const result = await verifySignInOtpAction({ email, code: data.code });

    if (!result.success) {
      throw new Error(result.error || errors.invalidOtp);
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
