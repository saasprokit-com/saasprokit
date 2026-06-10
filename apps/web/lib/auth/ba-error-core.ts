import type { AuthErrorCode } from "@repo/auth/server";
import type { Dictionary } from "@repo/internationalization";

export type BAErrorMessages = Dictionary["errors"]["ba"];

/**
 * Compile-time bridge between Better Auth's error codes and the dictionary.
 *
 * Every code in `auth.$ERROR_CODES` must have a translation in
 * `errors.ba`, and every `errors.ba` key must still be a live Better Auth
 * code. When a Better Auth upgrade breaks this, typecheck fails here — run
 * `scripts/sync-ba-errors.ts` (see its header) and `pnpm translate`.
 *
 * The two assertions are NOT redundant: if AuthErrorCode ever widens to
 * `string` (e.g. a plugin types its codes loosely), only
 * _NoMissingTranslations fails loudly — _NoStaleTranslations degrades to
 * `never` silently. Keep both.
 */
type AssertNever<T extends never> = T;
type _NoMissingTranslations = AssertNever<
  Exclude<AuthErrorCode, keyof BAErrorMessages>
>;
type _NoStaleTranslations = AssertNever<
  Exclude<keyof BAErrorMessages, AuthErrorCode>
>;

/**
 * Extract the stable error code from a Better Auth error.
 *
 * Server-side `auth.api` calls throw `APIError` (better-call) with the code
 * at `body.code`; client-side `authClient` calls return `result.error` with
 * the code at the top level. Codes look like
 * "USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION".
 */
export function extractBAErrorCode(error: unknown): string | null {
  if (error == null || typeof error !== "object") {
    return null;
  }

  if (
    "body" in error &&
    error.body != null &&
    typeof error.body === "object" &&
    "code" in error.body &&
    typeof error.body.code === "string"
  ) {
    return error.body.code;
  }

  if ("code" in error && typeof error.code === "string") {
    return error.code;
  }

  return null;
}

/**
 * Map a Better Auth error to its localized message, or null when the error
 * carries no known Better Auth code (caller picks the fallback).
 */
export function translateBAError(
  messages: BAErrorMessages,
  error: unknown
): string | null {
  const code = extractBAErrorCode(error);
  if (code && Object.hasOwn(messages, code)) {
    return messages[code as keyof BAErrorMessages];
  }
  return null;
}
