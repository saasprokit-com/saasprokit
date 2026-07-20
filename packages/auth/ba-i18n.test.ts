import { baErrorTranslations } from "@repo/internationalization/ba-errors";
import {
  localeFromPathname,
  localeFromReferer,
  locales,
} from "@repo/internationalization/shared";
import { describe, expect, it } from "vitest";

describe("baErrorTranslations", () => {
  it("covers every app locale", () => {
    for (const locale of locales) {
      expect(baErrorTranslations).toHaveProperty(locale);
    }
  });

  it("has identical key sets across locales (languine drift guard)", () => {
    const enKeys = Object.keys(baErrorTranslations.en).sort();
    for (const [locale, table] of Object.entries(baErrorTranslations)) {
      expect(Object.keys(table).sort(), `locale ${locale}`).toEqual(enKeys);
    }
  });

  it("has no empty or untranslated-placeholder values", () => {
    for (const [locale, table] of Object.entries(baErrorTranslations)) {
      for (const [code, message] of Object.entries(table)) {
        expect(message, `${locale}.${code}`).toBeTruthy();
      }
    }
  });

  it("translates the duplicate-invite code in German", () => {
    expect(
      baErrorTranslations.de.USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION
    ).toBe("Einladung wurde bereits an diese E-Mail gesendet");
  });

  it("includes all known Better Auth error codes (exhaustiveness check)", () => {
    const knownCodes = new Set([
      // BASE_ERROR_CODES (extracted from better-auth/core)
      "ACCOUNT_NOT_FOUND",
      "ACCOUNT_TEMPORARILY_LOCKED",
      "CREDENTIAL_ACCOUNT_NOT_FOUND",
      "CROSS_SITE_NAVIGATION_LOGIN_BLOCKED",
      "EMAIL_ALREADY_VERIFIED",
      "EMAIL_CAN_NOT_BE_UPDATED",
      "EMAIL_MISMATCH",
      "EMAIL_NOT_VERIFIED",
      "EMAIL_VERIFICATION_REQUIRED",
      "FAILED_TO_CREATE_SESSION",
      "FAILED_TO_CREATE_USER",
      "FAILED_TO_CREATE_VERIFICATION",
      "FAILED_TO_GET_SESSION",
      "FAILED_TO_GET_USER_INFO",
      "FAILED_TO_UNLINK_LAST_ACCOUNT",
      "FAILED_TO_UPDATE_USER",
      "ID_TOKEN_NOT_SUPPORTED",
      "INVALID_EMAIL",
      "INVALID_EMAIL_OR_PASSWORD",
      "INVALID_NEW_USER_CALLBACK_URL",
      "INVALID_PASSWORD",
      "INVALID_TOKEN",
      "INVALID_USER",
      "LINKED_ACCOUNT_ALREADY_EXISTS",
      "PASSWORD_ALREADY_SET",
      "PASSWORD_TOO_LONG",
      "PASSWORD_TOO_SHORT",
      "PROVIDER_NOT_FOUND",
      "SESSION_EXPIRED",
      "SESSION_NOT_FRESH",
      "SOCIAL_ACCOUNT_ALREADY_LINKED",
      "TOKEN_EXPIRED",
      "USER_ALREADY_EXISTS",
      "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
      "USER_ALREADY_HAS_PASSWORD",
      "USER_EMAIL_NOT_FOUND",
      "USER_NOT_FOUND",
      "VERIFICATION_EMAIL_NOT_ENABLED",
      // Admin plugin
      "BANNED_USER",
      "FAILED_TO_CREATE_USER",
      "INVALID_ROLE_TYPE",
      "NO_DATA_TO_UPDATE",
      "PASSWORD_CANNOT_BE_UPDATED_VIA_UPDATE_USER",
      "YOU_ARE_NOT_ALLOWED_TO_BAN_USERS",
      "YOU_ARE_NOT_ALLOWED_TO_CHANGE_USERS_ROLE",
      "YOU_ARE_NOT_ALLOWED_TO_CREATE_USERS",
      "YOU_ARE_NOT_ALLOWED_TO_DELETE_USERS",
      "YOU_ARE_NOT_ALLOWED_TO_GET_USER",
      "YOU_ARE_NOT_ALLOWED_TO_IMPERSONATE_USERS",
      "YOU_ARE_NOT_ALLOWED_TO_LIST_USERS",
      "YOU_ARE_NOT_ALLOWED_TO_LIST_USERS_SESSIONS",
      "YOU_ARE_NOT_ALLOWED_TO_REVOKE_USERS_SESSIONS",
      "YOU_ARE_NOT_ALLOWED_TO_SET_USERS_EMAIL",
      "YOU_ARE_NOT_ALLOWED_TO_SET_USERS_PASSWORD",
      "YOU_ARE_NOT_ALLOWED_TO_UPDATE_USERS",
      "YOU_CANNOT_BAN_YOURSELF",
      "YOU_CANNOT_IMPERSONATE_ADMINS",
      "YOU_CANNOT_REMOVE_YOURSELF",
      // Email-OTP plugin
      "INVALID_OTP",
      "OTP_EXPIRED",
      "TOO_MANY_ATTEMPTS",
      // Two-Factor plugin
      "ACCOUNT_TEMPORARILY_LOCKED",
      "BACKUP_CODES_NOT_ENABLED",
      "INVALID_BACKUP_CODE",
      "INVALID_CODE",
      "INVALID_TWO_FACTOR_COOKIE",
      "OTP_HAS_EXPIRED",
      "OTP_NOT_ENABLED",
      "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE",
      "TOTP_NOT_ENABLED",
      "TWO_FACTOR_NOT_ENABLED",
      // Organization plugin
      "INVITATION_LIMIT_REACHED",
      "INVITATION_NOT_FOUND",
      "INVITER_IS_NO_LONGER_A_MEMBER_OF_THE_ORGANIZATION",
      "MEMBER_NOT_FOUND",
      "NO_ACTIVE_ORGANIZATION",
      "ORGANIZATION_ALREADY_EXISTS",
      "ORGANIZATION_HAS_ACTIVE_SUBSCRIPTION",
      "ORGANIZATION_MEMBERSHIP_LIMIT_REACHED",
      "ORGANIZATION_NOT_FOUND",
      "ORGANIZATION_SLUG_ALREADY_TAKEN",
      "ROLE_IS_ASSIGNED_TO_MEMBERS",
      "ROLE_NAME_IS_ALREADY_TAKEN",
      "ROLE_NOT_FOUND",
      "TEAM_ALREADY_EXISTS",
      "TEAM_MEMBER_LIMIT_REACHED",
      "TEAM_NOT_FOUND",
      "TOO_MANY_ROLES",
      "UNABLE_TO_REMOVE_LAST_TEAM",
      "USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION",
      "USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION",
      "USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION",
      "USER_IS_NOT_A_MEMBER_OF_THE_TEAM",
      "YOU_ARE_NOT_ALLOWED_TO_CANCEL_THIS_INVITATION",
      "YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_ORGANIZATION",
      "YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_TEAM",
      "YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_TEAM_MEMBER",
      "YOU_ARE_NOT_ALLOWED_TO_CREATE_A_ROLE",
      "YOU_ARE_NOT_ALLOWED_TO_CREATE_TEAMS_IN_THIS_ORGANIZATION",
      "YOU_ARE_NOT_ALLOWED_TO_DELETE_A_ROLE",
      "YOU_ARE_NOT_ALLOWED_TO_DELETE_TEAMS_IN_THIS_ORGANIZATION",
      "YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER",
      "YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_ORGANIZATION",
      "YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_TEAM",
      "YOU_ARE_NOT_ALLOWED_TO_GET_A_ROLE",
      "YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION",
      "YOU_ARE_NOT_ALLOWED_TO_INVITE_USER_WITH_THIS_ROLE",
      "YOU_ARE_NOT_ALLOWED_TO_LIST_A_ROLE",
      "YOU_ARE_NOT_ALLOWED_TO_READ_A_ROLE",
      "YOU_ARE_NOT_ALLOWED_TO_UPDATE_A_ROLE",
      "YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_MEMBER",
      "YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_ORGANIZATION",
      "YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_TEAM",
      "YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION",
      "YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER",
      "YOU_CANNOT_LEAVE_THE_ORGANIZATION_WITHOUT_AN_OWNER",
      "YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_ORGANIZATIONS",
      "YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_TEAMS",
      "YOU_MUST_BE_IN_AN_ORGANIZATION_TO_CREATE_A_ROLE",
      "YOU_DO_NOT_HAVE_AN_ACTIVE_TEAM",
      "YOU_CAN_NOT_ACCESS_THE_MEMBERS_OF_THIS_TEAM",
      "YOU_ARE_NOT_ALLOWED_TO_REMOVE_A_TEAM_MEMBER",
      "YOU_ARE_NOT_ALLOWED_TO_ACCESS_THIS_ORGANIZATION",
      "YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION",
      "MISSING_AC_INSTANCE",
      "INVALID_RESOURCE",
      "INVALID_TEAM_ID",
      // Stripe plugin
      "ALREADY_SUBSCRIBED_PLAN",
      "CUSTOMER_NOT_FOUND",
      "FAILED_TO_CONSTRUCT_STRIPE_EVENT",
      "FAILED_TO_FETCH_PLANS",
      "ORGANIZATION_SUBSCRIPTION_NOT_ENABLED",
      "REFERENCE_ID_NOT_ALLOWED",
      "STRIPE_SIGNATURE_NOT_FOUND",
      "STRIPE_WEBHOOK_ERROR",
      "STRIPE_WEBHOOK_SECRET_NOT_FOUND",
      "SUBSCRIPTION_NOT_ACTIVE",
      "SUBSCRIPTION_NOT_FOUND",
      "SUBSCRIPTION_NOT_PENDING_CHANGE",
      "SUBSCRIPTION_NOT_SCHEDULED_FOR_CANCELLATION",
      "SUBSCRIPTION_PLAN_NOT_FOUND",
      "UNABLE_TO_CREATE_BILLING_PORTAL",
      "UNABLE_TO_CREATE_CUSTOMER",
      // App-thrown codes
      "CANNOT_CHANGE_OWN_ROLE",
      "TRANSFER_ORGANIZATION_OWNERSHIP",
    ]);

    const enKeys = new Set(Object.keys(baErrorTranslations.en));
    const missing = Array.from(knownCodes).filter((code) => !enKeys.has(code));

    expect(missing, "Missing BA error codes in ba-errors/en.json").toEqual([]);
  });
});

describe("localeFromPathname", () => {
  it("extracts a known locale prefix", () => {
    expect(localeFromPathname("/de/account/security")).toBe("de");
    expect(localeFromPathname("/zh")).toBe("zh");
  });

  it("returns null for unprefixed or unknown paths", () => {
    expect(localeFromPathname("/account/security")).toBeNull();
    expect(localeFromPathname("/xx/account")).toBeNull();
    expect(localeFromPathname("/")).toBeNull();
  });
});

describe("localeFromReferer", () => {
  it("extracts the locale from a referer URL", () => {
    expect(localeFromReferer("https://app.example.com/fr/members")).toBe("fr");
  });

  it("returns null for missing or malformed referers", () => {
    expect(localeFromReferer(null)).toBeNull();
    expect(localeFromReferer(undefined)).toBeNull();
    expect(localeFromReferer("not a url")).toBeNull();
    expect(localeFromReferer("https://app.example.com/members")).toBeNull();
  });
});
