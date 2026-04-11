import type { Dictionary } from "@repo/internationalization";
import { getDictionary } from "@repo/internationalization";
import { getLocaleFromRequest } from "@/lib/infrastructure/revalidation";

type FallbackKey = keyof Dictionary["errors"]["fallback"];

/**
 * Extract the stable error code from a Better Auth APIError.
 *
 * BA's APIError (from better-call) exposes `body.code` with values like
 * "USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION". When the error is a
 * plain Error we derive a code from its message as a best-effort fallback.
 */
export function extractBAErrorCode(error: unknown): string | null {
  if (
    error != null &&
    typeof error === "object" &&
    "body" in error &&
    error.body != null &&
    typeof error.body === "object" &&
    "code" in error.body &&
    typeof error.body.code === "string"
  ) {
    return error.body.code;
  }

  // Derive code from message (e.g. "User is already a member" → "USER_IS_ALREADY_A_MEMBER")
  if (error instanceof Error && error.message) {
    return error.message.toUpperCase().replace(/[\s-]+/g, "_");
  }

  return null;
}

/**
 * Map a Better Auth error to a localized, user-friendly message.
 *
 * 1. Extracts the stable `body.code` from the APIError
 * 2. Loads the dictionary for the current request locale
 * 3. Returns the matching `errors.ba[code]` translation
 * 4. Falls back to `errors.fallback[fallbackKey]`
 */
export async function mapBAError(
  error: unknown,
  fallbackKey: FallbackKey
): Promise<string> {
  const locale = await getLocaleFromRequest();
  const dict = await getDictionary(locale);

  const code = extractBAErrorCode(error);
  if (code) {
    const baErrors = dict.errors.ba as Record<string, string>;
    const translated = baErrors[code];
    if (translated) {
      return translated;
    }
  }

  return dict.errors.fallback[fallbackKey];
}
