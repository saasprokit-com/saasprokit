import type { SendEmailResult } from "./providers";
import { getEmailProvider } from "./providers";
import AccountDeletedEmail from "./templates/account-deleted";
import AccountLockedEmail from "./templates/account-locked";
import ArticlePublishedEmail from "./templates/article-published";
import EmailVerificationEmail from "./templates/email-verification";
import InvitationAcceptedEmail from "./templates/invitation-accepted";
import LoginNewDeviceEmail from "./templates/login-new-device";
import MagicLinkEmail from "./templates/magic-link";
import OrgInvitationEmail from "./templates/org-invitation";
import PasswordChangedEmail from "./templates/password-changed";
import PasswordResetEmail from "./templates/password-reset";
import PaymentReceiptEmail from "./templates/payment-receipt";
import RemovedFromOrgEmail from "./templates/removed-from-org";
import RoleChangedEmail from "./templates/role-changed";
import SignInOTPEmail from "./templates/sign-in-otp";
import SubscriptionCancelledEmail from "./templates/subscription-cancelled";
import SubscriptionDowngradedEmail from "./templates/subscription-downgraded";
import SubscriptionStartedEmail from "./templates/subscription-started";
import SubscriptionUpgradedEmail from "./templates/subscription-upgraded";
import TwoFactorOTPEmail from "./templates/two-factor-otp";
import VerificationOTPEmail from "./templates/verification-otp";
import WelcomeEmail from "./templates/welcome";

// ============================================================================
// Template Exports
// ============================================================================

export { default as AccountDeletedEmail } from "./templates/account-deleted";
export { default as AccountLockedEmail } from "./templates/account-locked";
// Content Templates
export { default as ArticlePublishedEmail } from "./templates/article-published";
export { default as EmailVerificationEmail } from "./templates/email-verification";
export { default as InvitationAcceptedEmail } from "./templates/invitation-accepted";
export { default as LoginNewDeviceEmail } from "./templates/login-new-device";
// Magic Link & OTP Templates
export { default as MagicLinkEmail } from "./templates/magic-link";
// Organization Templates
export { default as OrgInvitationEmail } from "./templates/org-invitation";
export { default as PasswordChangedEmail } from "./templates/password-changed";
// Auth & Security Templates
export { default as PasswordResetEmail } from "./templates/password-reset";
export { default as PaymentReceiptEmail } from "./templates/payment-receipt";
export { default as RemovedFromOrgEmail } from "./templates/removed-from-org";
export { default as RoleChangedEmail } from "./templates/role-changed";
export { default as SignInOTPEmail } from "./templates/sign-in-otp";
export { default as SubscriptionCancelledEmail } from "./templates/subscription-cancelled";
export { default as SubscriptionDowngradedEmail } from "./templates/subscription-downgraded";
// Subscription & Billing Templates
export { default as SubscriptionStartedEmail } from "./templates/subscription-started";
export { default as SubscriptionUpgradedEmail } from "./templates/subscription-upgraded";
export { default as TwoFactorOTPEmail } from "./templates/two-factor-otp";
export { default as VerificationOTPEmail } from "./templates/verification-otp";
export { default as WelcomeEmail } from "./templates/welcome";

// ============================================================================
// Configuration
// ============================================================================

import { keys } from "./keys";

// Validated environment variables
const emailEnv = keys();

// Default sender email
const FROM_EMAIL = emailEnv.EMAIL_FROM;

// ============================================================================
// Helper Function
// ============================================================================

/**
 * Send an email using the configured provider
 * Abstracts the provider details from individual send functions
 */
function sendEmail({
  to,
  subject,
  react,
  from = FROM_EMAIL,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
  from?: string;
}): Promise<SendEmailResult> {
  const provider = getEmailProvider();
  return provider.send({ to, subject, react, from });
}

// ============================================================================
// Auth & Security Email Functions
// ============================================================================

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({
  email,
  resetUrl,
}: {
  email: string;
  resetUrl: string;
}) {
  const result = await sendEmail({
    to: email,
    subject: "Reset Your Password",
    react: PasswordResetEmail({
      userEmail: email,
      resetUrl,
    }),
  });

  if (!result.success) {
    throw result.error || new Error("Failed to send email");
  }

  return { success: true, messageId: result.messageId };
}

/**
 * Send two-factor authentication OTP email
 */
export async function sendTwoFactorOTPEmail({
  email,
  otp,
  expiresInMinutes = 5,
}: {
  email: string;
  otp: string;
  expiresInMinutes?: number;
}) {
  const result = await sendEmail({
    to: email,
    subject: "Your verification code",
    react: TwoFactorOTPEmail({
      userEmail: email,
      otp,
      expiresInMinutes,
    }),
  });

  if (!result.success) {
    throw result.error || new Error("Failed to send email");
  }

  return { success: true, messageId: result.messageId };
}

/**
 * Send magic link sign-in email
 */
export async function sendMagicLinkEmail({
  email,
  magicLinkUrl,
  expiresInMinutes = 10,
}: {
  email: string;
  magicLinkUrl: string;
  expiresInMinutes?: number;
}) {
  const result = await sendEmail({
    to: email,
    subject: "Sign in to your account",
    react: MagicLinkEmail({
      userEmail: email,
      magicLinkUrl,
      expiresInMinutes,
    }),
  });

  if (!result.success) {
    throw result.error || new Error("Failed to send email");
  }

  return { success: true, messageId: result.messageId };
}

/**
 * Send sign-in OTP email
 */
export async function sendSignInOTPEmail({
  email,
  otp,
  expiresInMinutes = 5,
}: {
  email: string;
  otp: string;
  expiresInMinutes?: number;
}) {
  const result = await sendEmail({
    to: email,
    subject: "Your sign-in code",
    react: SignInOTPEmail({
      userEmail: email,
      otp,
      expiresInMinutes,
    }),
  });

  if (!result.success) {
    throw result.error || new Error("Failed to send email");
  }

  return { success: true, messageId: result.messageId };
}

/**
 * Send verification OTP email (for email verification)
 */
export async function sendVerificationOTPEmail({
  email,
  otp,
  expiresInMinutes = 5,
}: {
  email: string;
  otp: string;
  expiresInMinutes?: number;
}) {
  const result = await sendEmail({
    to: email,
    subject: "Verify your email address",
    react: VerificationOTPEmail({
      userEmail: email,
      otp,
      expiresInMinutes,
    }),
  });

  if (!result.success) {
    throw result.error || new Error("Failed to send email");
  }

  return { success: true, messageId: result.messageId };
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail({
  email,
  name,
}: {
  email: string;
  name?: string;
}) {
  const result = await sendEmail({
    to: email,
    subject: "Welcome to SaaS App!",
    react: WelcomeEmail({
      name: name || "there",
    }),
  });

  if (!result.success) {
    throw result.error || new Error("Failed to send email");
  }

  return { success: true, messageId: result.messageId };
}

export async function sendEmailVerificationEmail({
  email,
  userName,
  verificationUrl,
}: {
  email: string;
  userName?: string;
  verificationUrl: string;
}) {
  const result = await sendEmail({
    to: email,
    subject: "Verify Your Email Address",
    react: EmailVerificationEmail({
      userName: userName || email.split("@")[0],
      userEmail: email,
      verificationUrl,
    }),
  });

  if (!result.success) {
    throw result.error || new Error("Failed to send email");
  }

  return { success: true, messageId: result.messageId };
}

/**
 * Send login from new device alert
 */
export async function sendLoginNewDeviceEmail({
  email,
  userName,
  deviceInfo,
  location,
  ipAddress,
  loginTime,
  secureAccountUrl,
}: {
  email: string;
  userName?: string;
  deviceInfo?: string;
  location?: string;
  ipAddress?: string;
  loginTime?: string;
  secureAccountUrl?: string;
}) {
  const result = await sendEmail({
    to: email,
    subject: "New Login Detected on Your Account",
    react: LoginNewDeviceEmail({
      userName,
      deviceInfo,
      location,
      ipAddress,
      loginTime,
      secureAccountUrl,
    }),
  });

  if (!result.success) {
    throw result.error || new Error("Failed to send email");
  }

  return { success: true, messageId: result.messageId };
}

/**
 * Send password changed confirmation
 */
export async function sendPasswordChangedEmail({
  email,
  userName,
  changedAt,
  ipAddress,
  secureAccountUrl,
}: {
  email: string;
  userName?: string;
  changedAt?: string;
  ipAddress?: string;
  secureAccountUrl?: string;
}) {
  const result = await sendEmail({
    to: email,
    subject: "Your Password Has Been Changed",
    react: PasswordChangedEmail({
      userName,
      changedAt,
      ipAddress,
      secureAccountUrl,
    }),
  });

  if (!result.success) {
    throw result.error || new Error("Failed to send email");
  }

  return { success: true, messageId: result.messageId };
}

/**
 * Send account locked notification
 */
export async function sendAccountLockedEmail({
  email,
  userName,
  lockReason,
  failedAttempts,
  lockedAt,
  unlockTime,
  resetPasswordUrl,
}: {
  email: string;
  userName?: string;
  lockReason?: string;
  failedAttempts?: number;
  lockedAt?: string;
  unlockTime?: string;
  resetPasswordUrl?: string;
}) {
  const result = await sendEmail({
    to: email,
    subject: "Your Account Has Been Locked",
    react: AccountLockedEmail({
      userName,
      lockReason,
      failedAttempts,
      lockedAt,
      unlockTime,
      resetPasswordUrl,
    }),
  });

  if (!result.success) {
    throw result.error || new Error("Failed to send email");
  }

  return { success: true, messageId: result.messageId };
}

/**
 * Send account deleted confirmation email
 */
export async function sendAccountDeletedEmail({
  email,
  userName,
  deletedAt,
  supportEmail,
}: {
  email: string;
  userName?: string;
  deletedAt?: string;
  supportEmail?: string;
}) {
  const result = await sendEmail({
    to: email,
    subject: "Your account has been deleted",
    react: AccountDeletedEmail({
      userName,
      deletedAt,
      supportEmail,
    }),
  });

  if (!result.success) {
    throw result.error || new Error("Failed to send email");
  }

  return { success: true, messageId: result.messageId };
}

export async function sendOrgInvitationEmail({
  email,
  inviterName,
  organizationName,
  role,
  inviteUrl,
  expiresAt,
  message,
}: {
  email: string;
  inviterName?: string;
  organizationName?: string;
  role?: string;
  inviteUrl?: string;
  expiresAt?: string;
  message?: string;
}) {
  const result = await sendEmail({
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
  });

  if (!result.success) {
    throw result.error || new Error("Failed to send email");
  }

  return { success: true, messageId: result.messageId };
}

/**
 * Send invitation accepted notification to org owner
 */
export async function sendInvitationAcceptedEmail({
  email,
  ownerName,
  newMemberName,
  newMemberEmail,
  organizationName,
  role,
  joinedAt,
  teamUrl,
}: {
  email: string;
  ownerName?: string;
  newMemberName?: string;
  newMemberEmail?: string;
  organizationName?: string;
  role?: string;
  joinedAt?: string;
  teamUrl?: string;
}) {
  const result = await sendEmail({
    to: email,
    subject: `${newMemberName || "Someone"} has joined ${organizationName || "your organization"}`,
    react: InvitationAcceptedEmail({
      ownerName,
      newMemberName,
      newMemberEmail,
      organizationName,
      role,
      joinedAt,
      teamUrl,
    }),
  });

  if (!result.success) {
    throw result.error || new Error("Failed to send email");
  }

  return { success: true, messageId: result.messageId };
}

/**
 * Send role changed notification
 */
export async function sendRoleChangedEmail({
  email,
  userName,
  organizationName,
  previousRole,
  newRole,
  changedBy,
  changedAt,
  dashboardUrl,
}: {
  email: string;
  userName?: string;
  organizationName?: string;
  previousRole?: string;
  newRole?: string;
  changedBy?: string;
  changedAt?: string;
  dashboardUrl?: string;
}) {
  const result = await sendEmail({
    to: email,
    subject: `Your role has been updated in ${organizationName || "your organization"}`,
    react: RoleChangedEmail({
      userName,
      organizationName,
      previousRole,
      newRole,
      changedBy,
      changedAt,
      dashboardUrl,
    }),
  });

  if (!result.success) {
    throw result.error || new Error("Failed to send email");
  }

  return { success: true, messageId: result.messageId };
}

/**
 * Send removed from organization notification
 */
export async function sendRemovedFromOrgEmail({
  email,
  userName,
  organizationName,
  removedBy,
  removedAt,
  supportEmail,
}: {
  email: string;
  userName?: string;
  organizationName?: string;
  removedBy?: string;
  removedAt?: string;
  supportEmail?: string;
}) {
  const result = await sendEmail({
    to: email,
    subject: `You've been removed from ${organizationName || "an organization"}`,
    react: RemovedFromOrgEmail({
      userName,
      organizationName,
      removedBy,
      removedAt,
      supportEmail,
    }),
  });

  if (!result.success) {
    throw result.error || new Error("Failed to send email");
  }

  return { success: true, messageId: result.messageId };
}

// ============================================================================
// Subscription & Billing Email Functions
// ============================================================================

/**
 * Send subscription started email
 */
export async function sendSubscriptionStartedEmail({
  email,
  userName,
  planName,
  billingInterval,
  amount,
  nextBillingDate,
  dashboardUrl,
}: {
  email: string;
  userName?: string;
  planName?: string;
  billingInterval?: string;
  amount?: string;
  nextBillingDate?: string;
  dashboardUrl?: string;
}) {
  const result = await sendEmail({
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
  });

  if (!result.success) {
    throw result.error || new Error("Failed to send email");
  }

  return { success: true, messageId: result.messageId };
}

/**
 * Send payment receipt email
 */
export async function sendPaymentReceiptEmail({
  email,
  userName,
  invoiceNumber,
  amount,
  planName,
  billingPeriod,
  paymentMethod,
  paymentDate,
  receiptUrl,
}: {
  email: string;
  userName?: string;
  invoiceNumber?: string;
  amount?: string;
  planName?: string;
  billingPeriod?: string;
  paymentMethod?: string;
  paymentDate?: string;
  receiptUrl?: string;
}) {
  const result = await sendEmail({
    to: email,
    subject: `Payment receipt for ${amount || "your subscription"}`,
    react: PaymentReceiptEmail({
      userName,
      invoiceNumber,
      amount,
      planName,
      billingPeriod,
      paymentMethod,
      paymentDate,
      receiptUrl,
    }),
  });

  if (!result.success) {
    throw result.error || new Error("Failed to send email");
  }

  return { success: true, messageId: result.messageId };
}

/**
 * Send subscription upgraded email
 */
export async function sendSubscriptionUpgradedEmail({
  email,
  userName,
  previousPlan,
  newPlan,
  newAmount,
  billingInterval,
  effectiveDate,
  dashboardUrl,
}: {
  email: string;
  userName?: string;
  previousPlan?: string;
  newPlan?: string;
  newAmount?: string;
  billingInterval?: string;
  effectiveDate?: string;
  dashboardUrl?: string;
}) {
  const result = await sendEmail({
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
  });

  if (!result.success) {
    throw result.error || new Error("Failed to send email");
  }

  return { success: true, messageId: result.messageId };
}

/**
 * Send subscription downgraded email
 */
export async function sendSubscriptionDowngradedEmail({
  email,
  userName,
  previousPlan,
  newPlan,
  newAmount,
  billingInterval,
  effectiveDate,
  lostFeatures,
  dashboardUrl,
}: {
  email: string;
  userName?: string;
  previousPlan?: string;
  newPlan?: string;
  newAmount?: string;
  billingInterval?: string;
  effectiveDate?: string;
  lostFeatures?: string[];
  dashboardUrl?: string;
}) {
  const result = await sendEmail({
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
  });

  if (!result.success) {
    throw result.error || new Error("Failed to send email");
  }

  return { success: true, messageId: result.messageId };
}

/**
 * Send subscription cancelled email
 */
export async function sendSubscriptionCancelledEmail({
  email,
  userName,
  planName,
  accessUntil,
  cancellationReason,
  reactivateUrl,
  feedbackUrl,
}: {
  email: string;
  userName?: string;
  planName?: string;
  accessUntil?: string;
  cancellationReason?: string;
  reactivateUrl?: string;
  feedbackUrl?: string;
}) {
  const result = await sendEmail({
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
  });

  if (!result.success) {
    throw result.error || new Error("Failed to send email");
  }

  return { success: true, messageId: result.messageId };
}

// ============================================================================
// Content Email Functions
// ============================================================================

/**
 * Send article published notification
 */
export async function sendArticlePublishedEmail({
  email,
  userName,
  articleTitle,
  articleExcerpt,
  articleUrl,
  coverImageUrl,
  publishedAt,
  dashboardUrl,
  analyticsUrl,
}: {
  email: string;
  userName?: string;
  articleTitle?: string;
  articleExcerpt?: string;
  articleUrl?: string;
  coverImageUrl?: string;
  publishedAt?: string;
  dashboardUrl?: string;
  analyticsUrl?: string;
}) {
  const result = await sendEmail({
    to: email,
    subject: `Your article "${articleTitle || "Untitled"}" is now live!`,
    react: ArticlePublishedEmail({
      userName,
      articleTitle,
      articleExcerpt,
      articleUrl,
      coverImageUrl,
      publishedAt,
      dashboardUrl,
      analyticsUrl,
    }),
  });

  if (!result.success) {
    throw result.error || new Error("Failed to send email");
  }

  return { success: true, messageId: result.messageId };
}

// ============================================================================
// Export Provider Utilities
// ============================================================================

export type {
  EmailProvider,
  SendEmailOptions,
  SendEmailResult,
} from "./providers";
export {
  getEmailProvider,
  getProviderName,
  resetEmailProvider,
} from "./providers";
