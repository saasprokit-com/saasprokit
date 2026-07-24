import "server-only";

import type { Dictionary } from "@repo/internationalization";
import { getDictionary } from "@repo/internationalization";
import type { ActionResult } from "@/lib/auth/auth";
import { getLocaleFromRequest } from "@/lib/infrastructure/revalidation";

export type ActionErrorCode = keyof Dictionary["errors"]["action"];

interface ActionErrorOptions {
  fallback: ActionErrorCode;
  logger?: { error: (obj: Record<string, unknown>, msg: string) => void };
  logMessage?: string;
}

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

export async function actionError<T = void>(
  code: ActionErrorCode
): Promise<ActionResult<T>> {
  const locale = await getLocaleFromRequest();
  const dict = await getDictionary(locale);
  return { success: false, error: dict.errors.action[code] };
}

export async function toFormError(
  error: unknown,
  options: ActionErrorOptions
): Promise<{ status: "error"; error?: string }> {
  const result = await toActionError(error, options);
  return { status: "error", error: result.error };
}

export async function formActionError(
  code: ActionErrorCode
): Promise<{ status: "error"; error: string }> {
  const locale = await getLocaleFromRequest();
  const dict = await getDictionary(locale);
  return { status: "error", error: dict.errors.action[code] };
}
