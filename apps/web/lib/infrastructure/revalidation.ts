import { DEFAULT_LOCALE } from "@repo/internationalization";
import { localeFromReferer } from "@repo/internationalization/shared";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

// Shares localeFromReferer with the @better-auth/i18n plugin's getLocale
// (packages/auth/server.ts) so both resolve the same locale per request.
export async function getLocaleFromRequest(): Promise<string> {
  const referer = (await headers()).get("referer");
  return localeFromReferer(referer) ?? DEFAULT_LOCALE;
}

export function buildLocalePath(locale: string, path: string): string {
  return locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;
}

export async function revalidateOrgPage(
  orgSlug: string,
  subpath: string,
  locale?: string
): Promise<void> {
  const resolvedLocale = locale ?? (await getLocaleFromRequest());
  revalidatePath(buildLocalePath(resolvedLocale, `/${orgSlug}/${subpath}`));
}

export async function revalidateAccountPage(subpath: string): Promise<void> {
  const locale = await getLocaleFromRequest();
  revalidatePath(buildLocalePath(locale, `/account/${subpath}`));
}

export async function revalidateAdminPage(subpath: string): Promise<void> {
  const locale = await getLocaleFromRequest();
  revalidatePath(
    buildLocalePath(locale, subpath ? `/admin/${subpath}` : "/admin")
  );
}
