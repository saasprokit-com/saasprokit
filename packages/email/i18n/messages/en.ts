import type { MessageCatalog } from "../types";

/**
 * English (default) message catalog
 */
export const en: MessageCatalog = {
  // Common
  "common.greeting": "Hi {name},",
  "common.thanks": "Thank you",
  "common.support":
    "If you have any questions, please contact our support team.",
  "common.footer": "This email was sent by {appName}.",
  "common.hi": "Hi,",

  // Welcome
  "welcome.preview": "Welcome to our platform",
  "welcome.title": "Welcome, {name}!",
  "welcome.message":
    "Thank you for joining us. We're excited to have you on board.",
  "welcome.cta": "Go to Dashboard",

  // Password Reset
  "passwordReset.preview": "Reset your password",
  "passwordReset.title": "Reset Your Password",
  "passwordReset.message":
    "We received a request to reset the password for the account associated with {email}.",
  "passwordReset.cta": "Reset Password",
  "passwordReset.expiry": "This link will expire in {hours} hour.",
  "passwordReset.ignore":
    "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.",

  // Email Verification
  "emailVerification.preview": "Verify your email address",
  "emailVerification.title": "Verify Your Email",
  "emailVerification.message":
    "Thanks for signing up! Please verify your email address {email} to complete your registration.",
  "emailVerification.cta": "Verify Email Address",
  "emailVerification.expiry": "This link will expire in {hours} hours.",

  // Password Changed
  "passwordChanged.preview": "Your password has been changed",
  "passwordChanged.title": "Password Changed",
  "passwordChanged.message":
    "The password for your account ({email}) was successfully changed.",
  "passwordChanged.warning":
    "If you didn't change your password, your account may be compromised. Please secure your account immediately.",
  "passwordChanged.cta": "Secure My Account",

  // Account Locked
  "accountLocked.preview": "Your account has been temporarily locked",
  "accountLocked.title": "Account Temporarily Locked",
  "accountLocked.message":
    "We've temporarily locked your account ({email}) due to multiple failed login attempts. This is a security measure to protect your account.",
  "accountLocked.cta": "Reset Password",

  // Subscription
  "subscription.upgraded.preview": "You've upgraded to {plan}!",
  "subscription.upgraded.title": "You've Upgraded!",
  "subscription.upgraded.message":
    "Congratulations! You've successfully upgraded from {previousPlan} to {newPlan}. Your new features are now available.",
  "subscription.downgraded.preview": "Your plan has been changed to {plan}",
  "subscription.downgraded.title": "Your Plan Has Changed",
  "subscription.downgraded.message":
    "Your subscription has been changed from {previousPlan} to {newPlan}. This change will take effect on {effectiveDate}.",
  "subscription.lostFeatures": "Features You'll Lose:",

  // Payment
  "payment.receipt.preview": "Payment receipt for {amount}",
  "payment.receipt.title": "Payment Receipt",
  "payment.receipt.message":
    "Thank you for your payment. Here's your receipt for your records.",
  "payment.failed.preview": "Action required: Payment failed",
  "payment.failed.title": "Payment Failed",
  "payment.failed.message":
    "We couldn't process your payment of {amount} for your {plan} subscription.",

  // Labels
  "label.plan": "Plan",
  "label.amount": "Amount",
  "label.date": "Date",
  "label.billingPeriod": "Billing Period",
  "label.paymentMethod": "Payment Method",
  "label.previousPlan": "Previous Plan",
  "label.newPlan": "New Plan",
  "label.effectiveDate": "Effective Date",
  "label.ipAddress": "IP Address",
  "label.lockedAt": "Locked At",
  "label.reason": "Reason",
  "label.failedAttempts": "Failed Attempts",
  "label.autoUnlock": "Auto-Unlock",
};
