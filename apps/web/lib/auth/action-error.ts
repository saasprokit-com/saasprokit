import "server-only";

import type { Dictionary } from "@repo/internationalization";
import { getDictionary } from "@repo/internationalization";
import type { ActionResult } from "@/lib/auth/auth";
import { extractBAErrorCode } from "@/lib/auth/ba-error";
import { getLocaleFromRequest } from "@/lib/infrastructure/revalidation";

export type ActionErrorCode = keyof Dictionary["errors"]["action"];
type BAFallbackKey = keyof Dictionary["errors"]["fallback"];

interface ActionErrorOptions {
  /** If the action calls Better Auth API, provide the BA fallback key */
  baFallback?: BAFallbackKey;
  /** Error code key from errors.action dictionary */
  fallback: ActionErrorCode;
  /** Logger instance — if provided, error is logged before returning */
  logger?: { error: (obj: Record<string, unknown>, msg: string) => void };
  /** Custom log message (defaults to the fallback dictionary text) */
  logMessage?: string;
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

  // 3. Better Auth APIError — map via BA code → i18n dictionary
  if (options.baFallback) {
    const code = extractBAErrorCode(error);
    if (code) {
      const baErrors = dict.errors.ba as Record<string, string>;
      const translated = baErrors[code];
      if (translated) {
        return { success: false, error: translated };
      }
    }
    return {
      success: false,
      error: dict.errors.fallback[options.baFallback],
    };
  }

  // 4. Generic fallback from action error dictionary
  return {
    success: false,
    error: dict.errors.action[options.fallback],
  };
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
