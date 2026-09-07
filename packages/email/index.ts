import type { ReactElement } from "react";
import { sendEmail } from "./providers";
import EmailVerificationEmail from "./templates/email-verification";
import MagicLinkEmail from "./templates/magic-link";
import OrgInvitationEmail from "./templates/org-invitation";
import PasswordResetEmail from "./templates/password-reset";
import SignInOTPEmail from "./templates/sign-in-otp";
import SubscriptionCancelledEmail from "./templates/subscription-cancelled";
import SubscriptionDowngradedEmail from "./templates/subscription-downgraded";
import SubscriptionStartedEmail from "./templates/subscription-started";
import SubscriptionUpgradedEmail from "./templates/subscription-upgraded";
import TwoFactorOTPEmail from "./templates/two-factor-otp";
import VerificationOTPEmail from "./templates/verification-otp";

export { default as EmailVerificationEmail } from "./templates/email-verification";
export { default as MagicLinkEmail } from "./templates/magic-link";
export { default as OrgInvitationEmail } from "./templates/org-invitation";
export { default as PasswordResetEmail } from "./templates/password-reset";
export { default as SignInOTPEmail } from "./templates/sign-in-otp";
export { default as SubscriptionCancelledEmail } from "./templates/subscription-cancelled";
export { default as SubscriptionDowngradedEmail } from "./templates/subscription-downgraded";
export { default as SubscriptionStartedEmail } from "./templates/subscription-started";
export { default as SubscriptionUpgradedEmail } from "./templates/subscription-upgraded";
export { default as TwoFactorOTPEmail } from "./templates/two-factor-otp";
export { default as VerificationOTPEmail } from "./templates/verification-otp";

import { keys } from "./keys";

const emailEnv = keys();
const FROM_EMAIL = emailEnv.EMAIL_FROM;

function createSender<Props>(
  build: (props: Props) => { react: ReactElement; subject: string; to: string }
) {
  return async (props: Props) => {
    const { to, subject, react } = build(props);
    const result = await sendEmail({ to, subject, react, from: FROM_EMAIL });

    if (!result.success) {
      throw result.error || new Error("Failed to send email");
    }

    return { success: true, messageId: result.messageId };
  };
}

export const sendPasswordResetEmail = createSender<{
  email: string;
  resetUrl: string;
}>(({ email, resetUrl }) => ({
  to: email,
  subject: "Reset Your Password",
  react: PasswordResetEmail({ userEmail: email, resetUrl }),
}));

export const sendTwoFactorOTPEmail = createSender<{
  email: string;
  otp: string;
  expiresInMinutes?: number;
}>(({ email, otp, expiresInMinutes = 5 }) => ({
  to: email,
  subject: "Your verification code",
  react: TwoFactorOTPEmail({ userEmail: email, otp, expiresInMinutes }),
}));

export const sendMagicLinkEmail = createSender<{
  email: string;
  magicLinkUrl: string;
  expiresInMinutes?: number;
}>(({ email, magicLinkUrl, expiresInMinutes = 10 }) => ({
  to: email,
  subject: "Sign in to your account",
  react: MagicLinkEmail({ userEmail: email, magicLinkUrl, expiresInMinutes }),
}));

export const sendSignInOTPEmail = createSender<{
  email: string;
  otp: string;
  expiresInMinutes?: number;
}>(({ email, otp, expiresInMinutes = 5 }) => ({
  to: email,
  subject: "Your sign-in code",
  react: SignInOTPEmail({ userEmail: email, otp, expiresInMinutes }),
}));

export const sendVerificationOTPEmail = createSender<{
  email: string;
  otp: string;
  expiresInMinutes?: number;
}>(({ email, otp, expiresInMinutes = 5 }) => ({
  to: email,
  subject: "Verify your email address",
  react: VerificationOTPEmail({ userEmail: email, otp, expiresInMinutes }),
}));

export const sendEmailVerificationEmail = createSender<{
  email: string;
  userName?: string;
  verificationUrl: string;
}>(({ email, userName, verificationUrl }) => ({
  to: email,
  subject: "Verify Your Email Address",
  react: EmailVerificationEmail({
    userName: userName || email.split("@")[0],
    userEmail: email,
    verificationUrl,
  }),
}));

export const sendOrgInvitationEmail = createSender<{
  email: string;
  inviterName?: string;
  organizationName?: string;
  role?: string;
  inviteUrl?: string;
  expiresAt?: string;
  message?: string;
}>(
  ({
    email,
    inviterName,
    organizationName,
    role,
    inviteUrl,
    expiresAt,
    message,
  }) => ({
    to: email,
    subject: `You've been invited to join ${organizationName || "an organization"}`,
    react: OrgInvitationEmail({
      inviterName,
      organizationName,
      role,
      inviteUrl,
      expiresAt,
      message,
    }),
  })
);

export const sendSubscriptionStartedEmail = createSender<{
  email: string;
  userName?: string;
  planName?: string;
  billingInterval?: string;
  amount?: string;
  nextBillingDate?: string;
  dashboardUrl?: string;
}>(
  ({
    email,
    userName,
    planName,
    billingInterval,
    amount,
    nextBillingDate,
    dashboardUrl,
  }) => ({
    to: email,
    subject: `Welcome to ${planName || "your new plan"}!`,
    react: SubscriptionStartedEmail({
      userName,
      planName,
      billingInterval,
      amount,
      nextBillingDate,
      dashboardUrl,
    }),
  })
);

export const sendSubscriptionUpgradedEmail = createSender<{
  email: string;
  userName?: string;
  previousPlan?: string;
  newPlan?: string;
  newAmount?: string;
  billingInterval?: string;
  effectiveDate?: string;
  dashboardUrl?: string;
}>(
  ({
    email,
    userName,
    previousPlan,
    newPlan,
    newAmount,
    billingInterval,
    effectiveDate,
    dashboardUrl,
  }) => ({
    to: email,
    subject: `You've upgraded to ${newPlan || "a new plan"}!`,
    react: SubscriptionUpgradedEmail({
      userName,
      previousPlan,
      newPlan,
      newAmount,
      billingInterval,
      effectiveDate,
      dashboardUrl,
    }),
  })
);

export const sendSubscriptionDowngradedEmail = createSender<{
  email: string;
  userName?: string;
  previousPlan?: string;
  newPlan?: string;
  newAmount?: string;
  billingInterval?: string;
  effectiveDate?: string;
  lostFeatures?: string[];
  dashboardUrl?: string;
}>(
  ({
    email,
    userName,
    previousPlan,
    newPlan,
    newAmount,
    billingInterval,
    effectiveDate,
    lostFeatures,
    dashboardUrl,
  }) => ({
    to: email,
    subject: `Your plan has been changed to ${newPlan || "a new plan"}`,
    react: SubscriptionDowngradedEmail({
      userName,
      previousPlan,
      newPlan,
      newAmount,
      billingInterval,
      effectiveDate,
      lostFeatures,
      dashboardUrl,
    }),
  })
);

export const sendSubscriptionCancelledEmail = createSender<{
  email: string;
  userName?: string;
  planName?: string;
  accessUntil?: string;
  cancellationReason?: string;
  reactivateUrl?: string;
  feedbackUrl?: string;
}>(
  ({
    email,
    userName,
    planName,
    accessUntil,
    cancellationReason,
    reactivateUrl,
    feedbackUrl,
  }) => ({
    to: email,
    subject: `Your ${planName || ""} subscription has been cancelled`,
    react: SubscriptionCancelledEmail({
      userName,
      planName,
      accessUntil,
      cancellationReason,
      reactivateUrl,
      feedbackUrl,
    }),
  })
);

export type { SendEmailOptions, SendEmailResult } from "./providers";
