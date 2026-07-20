/**
 * Client-safe internationalization exports.
 * No "server-only" guard — safe to import from "use client" components.
 */

import type en from "./dictionaries/en.json";

export const DEFAULT_LOCALE = "en";

export const locales = ["en", "es", "de", "zh", "fr", "pt"] as const;

export type Dictionary = typeof en;
export type ActionErrorMessages = Dictionary["errors"]["action"];

/** Extract the locale from a locale-prefixed pathname (e.g. "/de/account"). */
export function localeFromPathname(pathname: string): string | null {
  const first = pathname.split("/")[1];
  return first && (locales as readonly string[]).includes(first) ? first : null;
}

/** Extract the locale from a referer URL's pathname. */
export function localeFromReferer(
  referer: string | null | undefined
): string | null {
  if (!referer) {
    return null;
  }
  try {
    return localeFromPathname(new URL(referer).pathname);
  } catch {
    return null;
  }
}
