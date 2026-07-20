import "server-only";

import type { Dictionary } from "@repo/internationalization";
import { getDictionary } from "@repo/internationalization";
import type { ActionResult } from "@/lib/auth/auth";
import { getLocaleFromRequest } from "@/lib/infrastructure/revalidation";

export type ActionErrorCode = keyof Dictionary["errors"]["action"];

interface ActionErrorOptions {
  /** Error code key from errors.action dictionary */
  fallback: ActionErrorCode;
  /** Logger instance — if provided, error is logged before returning */
  logger?: { error: (obj: Record<string, unknown>, msg: string) => void };
  /** Custom log message (defaults to the fallback dictionary text) */
  logMessage?: string;
}

/**
 * Better Auth errors are localized by the @better-auth/i18n plugin
 * (packages/auth/server.ts), which stamps `body.originalMessage` only when it
 * actually applied a translation. Untranslated codes, uncoded APIErrors, and
 * non-APIError throws fall through to the localized generic fallback.
 */
function getPluginTranslatedMessage(error: unknown): string | null {
  if (
    error != null &&
    typeof error === "object" &&
    "body" in error &&
    error.body != null &&
    typeof error.body === "object" &&
    "originalMessage" in error.body &&
    typeof error.body.originalMessage === "string" &&
    "message" in error.body &&
    typeof error.body.message === "string"
  ) {
    return error.body.message;
  }
  return null;
}

/**
 * Unified error handler for server action catch blocks.
 *
 * Handles ZodError, Better Auth APIError, and generic errors.
 * All user-facing messages are i18n-aware via @repo/internationalization.
 *
 * Usage:
 *   catch (error) {
 *     return toActionError(error, { fallback: "updateProfile", logger });
 *   }
 */
export async function toActionError<T = void>(
  error: unknown,
  options: ActionErrorOptions
): Promise<ActionResult<T>> {
  const locale = await getLocaleFromRequest();
  const dict = await getDictionary(locale);

  // 1. ZodError — return first validation issue (Zod messages are already user-facing)
  if (error != null && typeof error === "object" && "issues" in error) {
    const zodError = error as { issues: Array<{ message: string }> };
    return {
      success: false,
      error: zodError.issues[0]?.message ?? dict.errors.action.invalidInput,
    };
  }

  // 2. Log error if logger provided
  if (options.logger) {
    options.logger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      options.logMessage ?? dict.errors.action[options.fallback]
    );
  }

  // 3. Better Auth APIError already localized by the i18n plugin
  const translated = getPluginTranslatedMessage(error);
  if (translated) {
    return { success: false, error: translated };
  }

  // 4. Generic fallback from action error dictionary
  return {
    success: false,
    error: dict.errors.action[options.fallback],
  };
}

/**
 * Resolve a Better Auth error to a localized message string.
 *
 * For call sites that need the message itself (not an ActionResult), e.g.
 * per-email failure reporting in bulk invites.
 */
export async function baErrorMessage(
  error: unknown,
  fallback: ActionErrorCode
): Promise<string> {
  const translated = getPluginTranslatedMessage(error);
  if (translated) {
    return translated;
  }
  const locale = await getLocaleFromRequest();
  const dict = await getDictionary(locale);
  return dict.errors.action[fallback];
}

/**
 * Return an i18n-aware ActionResult error for early-return guard checks.
 *
 * Usage:
 *   if (!caller) return actionError("unauthorized");
 */
export async function actionError<T = void>(
  code: ActionErrorCode
): Promise<ActionResult<T>> {
  const locale = await getLocaleFromRequest();
  const dict = await getDictionary(locale);
  return { success: false, error: dict.errors.action[code] };
}
