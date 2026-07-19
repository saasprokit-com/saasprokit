import { DEFAULT_LOCALE, locales } from "@repo/internationalization";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

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
    // Invalid URL — fallback
  }

  return DEFAULT_LOCALE;
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
