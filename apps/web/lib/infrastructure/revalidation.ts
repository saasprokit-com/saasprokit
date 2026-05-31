import { DEFAULT_LOCALE, locales } from "@repo/internationalization";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

/**
 * Extract current locale from the Referer header.
 * Checks if the first path segment is a known locale.
 * Falls back to DEFAULT_LOCALE when Referer is missing or unrecognized.
 */
export async function getLocaleFromRequest(): Promise<string> {
  const referer = (await headers()).get("referer");
  if (!referer) {
    return DEFAULT_LOCALE;
  }

  try {
    const url = new URL(referer);
    const firstSegment = url.pathname.split("/")[1];
    if (firstSegment && (locales as readonly string[]).includes(firstSegment)) {
      return firstSegment;
    }
  } catch {
    // Invalid URL — fall back
  }

  return DEFAULT_LOCALE;
}

/**
 * Build a locale-aware path.
 * Default locale has no URL prefix (rewriteDefault strategy).
 */
export function buildLocalePath(locale: string, path: string): string {
  return locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;
}

/**
 * Revalidate an org-scoped page.
 *
 * Pass `locale` explicitly when known (e.g. from a page's `params`) to avoid
 * Referer-based detection, which is unreliable when the user arrives from an
 * external domain like Stripe Checkout. Falls back to the Referer header when
 * omitted.
 */
export async function revalidateOrgPage(
  orgSlug: string,
  subpath: string,
  locale?: string
): Promise<void> {
  const resolvedLocale = locale ?? (await getLocaleFromRequest());
  revalidatePath(buildLocalePath(resolvedLocale, `/${orgSlug}/${subpath}`));
}

/**
 * Revalidate an account-scoped page for the current locale.
 */
export async function revalidateAccountPage(subpath: string): Promise<void> {
  const locale = await getLocaleFromRequest();
  revalidatePath(buildLocalePath(locale, `/account/${subpath}`));
}
