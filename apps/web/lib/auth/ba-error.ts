import { getDictionary } from "@repo/internationalization";
import { translateBAError } from "@/lib/auth/ba-error-core";
import { getLocaleFromRequest } from "@/lib/infrastructure/revalidation";

/**
 * Map a Better Auth error to a localized, user-friendly message string.
 *
 * Use in server code that needs a bare message (e.g. per-item failure
 * tracking) rather than an ActionResult — for action catch blocks, use
 * `toActionError` from `@/lib/auth/action-error` instead.
 */
export async function mapBAError(error: unknown): Promise<string> {
  const locale = await getLocaleFromRequest();
  const dict = await getDictionary(locale);
  return (
    translateBAError(dict.errors.ba, error) ?? dict.errors.action.unknownError
  );
}
