import { match as matchLocale } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import type { NextRequest } from "next/server";
import { createI18nMiddleware } from "next-international/middleware";
import { DEFAULT_LOCALE, locales } from "./shared";

// Widen to a mutable string[] so next-international infers a plain-string locale
// type (matches the resolver's `string | null` return and matchLocale's signature).
const localeList: string[] = [...locales];

// Locale code validation pattern (e.g., "en", "en-US", "zh-Hans")
const LOCALE_CODE_REGEX = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]+)*$/;

const I18nMiddleware = createI18nMiddleware({
  locales: localeList,
  defaultLocale: DEFAULT_LOCALE,
  urlMappingStrategy: "rewriteDefault",
  resolveLocaleFromRequest: (request: NextRequest): string | null => {
    try {
      const headers = Object.fromEntries(request.headers.entries());
      const negotiator = new Negotiator({ headers });
      const acceptedLanguages = negotiator.languages();

      // Filter out invalid locale codes (like "*")
      const validLanguages = acceptedLanguages.filter(
        (lang) => lang !== "*" && LOCALE_CODE_REGEX.test(lang)
      );

      if (validLanguages.length === 0) {
        return DEFAULT_LOCALE;
      }

      const matchedLocale = matchLocale(
        validLanguages,
        localeList,
        DEFAULT_LOCALE
      );
      return matchedLocale;
    } catch {
      // If locale matching fails, fall back to default
      return DEFAULT_LOCALE;
    }
  },
});

export const internationalizationMiddleware = (request: NextRequest) =>
  I18nMiddleware(request);
