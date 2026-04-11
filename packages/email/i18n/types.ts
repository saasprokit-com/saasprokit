/**
 * Supported locales for email templates
 */
export type Locale =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "ja"
  | "zh"
  | "pt"
  | "it"
  | "ru"
  | "ko";

/**
 * Default locale
 */
export const DEFAULT_LOCALE: Locale = "en";

/**
 * Supported locales list
 */
export const SUPPORTED_LOCALES: Locale[] = [
  "en",
  "es",
  "fr",
  "de",
  "ja",
  "zh",
  "pt",
  "it",
  "ru",
  "ko",
];

/**
 * Locale display names
 */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ja: "日本語",
  zh: "中文",
  pt: "Português",
  it: "Italiano",
  ru: "Русский",
  ko: "한국어",
};

/**
 * Message key type for type-safe message access
 */
export type MessageKey =
  // Common
  | "common.greeting"
  | "common.thanks"
  | "common.support"
  | "common.footer"
  | "common.hi"
  // Welcome
  | "welcome.preview"
  | "welcome.title"
  | "welcome.message"
  | "welcome.cta"
  // Password Reset
  | "passwordReset.preview"
  | "passwordReset.title"
  | "passwordReset.message"
  | "passwordReset.cta"
  | "passwordReset.expiry"
  | "passwordReset.ignore"
  // Email Verification
  | "emailVerification.preview"
  | "emailVerification.title"
  | "emailVerification.message"
  | "emailVerification.cta"
  | "emailVerification.expiry"
  // Password Changed
  | "passwordChanged.preview"
  | "passwordChanged.title"
  | "passwordChanged.message"
  | "passwordChanged.warning"
  | "passwordChanged.cta"
  // Account Locked
  | "accountLocked.preview"
  | "accountLocked.title"
  | "accountLocked.message"
  | "accountLocked.cta"
  // Subscription
  | "subscription.upgraded.preview"
  | "subscription.upgraded.title"
  | "subscription.upgraded.message"
  | "subscription.downgraded.preview"
  | "subscription.downgraded.title"
  | "subscription.downgraded.message"
  | "subscription.lostFeatures"
  // Payment
  | "payment.receipt.preview"
  | "payment.receipt.title"
  | "payment.receipt.message"
  | "payment.failed.preview"
  | "payment.failed.title"
  | "payment.failed.message"
  // Labels
  | "label.plan"
  | "label.amount"
  | "label.date"
  | "label.billingPeriod"
  | "label.paymentMethod"
  | "label.previousPlan"
  | "label.newPlan"
  | "label.effectiveDate"
  | "label.ipAddress"
  | "label.lockedAt"
  | "label.reason"
  | "label.failedAttempts"
  | "label.autoUnlock";

/**
 * Message catalog type
 */
export type MessageCatalog = Record<MessageKey, string>;

/**
 * Interpolation values type
 */
export type InterpolationValues = Record<string, string | number>;
