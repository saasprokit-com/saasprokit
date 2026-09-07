import { messages } from "./messages";
import type {
  InterpolationValues,
  Locale,
  MessageCatalog,
  MessageKey,
} from "./types";
import {
  DEFAULT_LOCALE,
  LOCALE_NAMES,
  SUPPORTED_LOCALES,
} from "./types";

// Re-export types and constants for convenient external API
export type { Locale, MessageKey, InterpolationValues, MessageCatalog };
export { DEFAULT_LOCALE, LOCALE_NAMES, SUPPORTED_LOCALES };

/**
 * Get a message catalog for a specific locale
 */
export function getMessages(locale: Locale = DEFAULT_LOCALE): MessageCatalog {
  return messages[locale] || messages[DEFAULT_LOCALE];
}

/**
 * Get a specific message with interpolation
 *
 * @example
 * getMessage("en", "common.greeting", { name: "John" })
 * // Returns: "Hi John,"
 */
export function getMessage(
  locale: Locale,
  key: MessageKey,
  values?: InterpolationValues
): string {
  const catalog = getMessages(locale);
  let message = catalog[key] || messages[DEFAULT_LOCALE][key] || key;

  // Interpolate values
  if (values) {
    for (const [name, value] of Object.entries(values)) {
      message = message.replace(
        new RegExp(`\\{${name}\\}`, "g"),
        String(value)
      );
    }
  }

  return message;
}

/**
 * Create a translation function for a specific locale
 *
 * @example
 * const t = createTranslator("es");
 * t("welcome.title", { name: "Juan" })
 * // Returns: "¡Bienvenido, Juan!"
 */
export function createTranslator(locale: Locale = DEFAULT_LOCALE) {
  return function t(key: MessageKey, values?: InterpolationValues): string {
    return getMessage(locale, key, values);
  };
}

/**
 * Format a date according to locale
 */
export function formatDate(
  date: Date | string,
  locale: Locale = DEFAULT_LOCALE,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  };

  // Map our locale codes to Intl locale codes
  const localeMap: Record<Locale, string> = {
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    ja: "ja-JP",
    zh: "zh-CN",
    pt: "pt-BR",
    it: "it-IT",
    ru: "ru-RU",
    ko: "ko-KR",
  };

  return dateObj.toLocaleDateString(localeMap[locale], defaultOptions);
}

/**
 * Format a date and time according to locale
 */
export function formatDateTime(
  date: Date | string,
  locale: Locale = DEFAULT_LOCALE
): string {
  return formatDate(date, locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format currency according to locale
 */
export function formatCurrency(
  amount: number,
  currency = "USD",
  locale: Locale = DEFAULT_LOCALE
): string {
  const localeMap: Record<Locale, string> = {
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    ja: "ja-JP",
    zh: "zh-CN",
    pt: "pt-BR",
    it: "it-IT",
    ru: "ru-RU",
    ko: "ko-KR",
  };

  return new Intl.NumberFormat(localeMap[locale], {
    style: "currency",
    currency,
  }).format(amount);
}

export function isLocaleSupported(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

/**
 * Get the best matching locale from an Accept-Language header
 */
export function getPreferredLocale(acceptLanguage?: string): Locale {
  if (!acceptLanguage) {
    return DEFAULT_LOCALE;
  }

  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code, qValue] = lang.trim().split(";q=");
      return {
        code: code.split("-")[0].toLowerCase(),
        quality: qValue ? Number.parseFloat(qValue) : 1,
      };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { code } of languages) {
    if (isLocaleSupported(code)) {
      return code;
    }
  }

  return DEFAULT_LOCALE;
}
