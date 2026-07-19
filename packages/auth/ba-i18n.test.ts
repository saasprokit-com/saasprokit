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
