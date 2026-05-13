import { match as matchLocale } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import type { NextRequest } from "next/server";
import { createI18nMiddleware } from "next-international/middleware";
import languine from "./languine.json" with { type: "json" };

const locales = [languine.locale.source, ...languine.locale.targets];

// Locale code validation pattern (e.g., "en", "en-US", "zh-Hans")
const LOCALE_CODE_REGEX = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]+)*$/;

const I18nMiddleware = createI18nMiddleware({
  locales,
  defaultLocale: "en",
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
        return "en";
      }

      const matchedLocale = matchLocale(validLanguages, locales, "en");
      return matchedLocale;
    } catch {
      // If locale matching fails, fall back to default
      return "en";
    }
  },
});

export const internationalizationMiddleware = (request: NextRequest) =>
  I18nMiddleware(request);
