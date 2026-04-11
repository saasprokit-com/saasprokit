import type { Locale, MessageCatalog } from "../types";
import { en } from "./en";
import { es } from "./es";

export { en } from "./en";
export { es } from "./es";

/**
 * All message catalogs indexed by locale
 */
export const messages: Record<Locale, MessageCatalog> = {
  en,
  es,
  // Add more locales as translations are completed
  fr: en, // Fallback to English
  de: en, // Fallback to English
  ja: en, // Fallback to English
  zh: en, // Fallback to English
  pt: en, // Fallback to English
  it: en, // Fallback to English
  ru: en, // Fallback to English
  ko: en, // Fallback to English
};
