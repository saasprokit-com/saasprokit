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

interface BaErrorInfo {
  code?: string;
  translatedMessage?: string;
}

// Duck-typed (not `instanceof APIError`): apps/web and @repo/auth resolve
// different better-auth versions, so class identity is unreliable.
function baErrorInfo(error: unknown): BaErrorInfo {
  if (
    error == null ||
    typeof error !== "object" ||
    !("body" in error) ||
    error.body == null ||
    typeof error.body !== "object"
  ) {
    return {};
  }
  const { body } = error;
  const code =
    "code" in body && typeof body.code === "string" ? body.code : undefined;
  // The i18n after-hook stamps originalMessage only when it translated the
  // body; untranslated English messages keep falling back to the dictionary.
  const translatedMessage =
    "originalMessage" in body &&
    typeof body.originalMessage === "string" &&
    "message" in body &&
    typeof body.message === "string"
      ? body.message
      : undefined;
  return { code, translatedMessage };
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
      code: "invalidInput",
    };
  }

  // 2. Log error if logger provided
  if (options.logger) {
    options.logger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      options.logMessage ?? dict.errors.action[options.fallback]
    );
  }

  const { code: baCode, translatedMessage } = baErrorInfo(error);
  // BA body.code survives even when the message was not translated, so
  // callers can branch on it while the user still sees the dictionary text.
  const code = baCode ?? options.fallback;

  // 3. Better Auth APIError already localized by the i18n plugin
  if (translatedMessage) {
    return { success: false, error: translatedMessage, code };
  }

  // 4. Generic fallback from action error dictionary
  return {
    success: false,
    error: dict.errors.action[options.fallback],
    code,
  };
}

export async function baErrorMessage(
  error: unknown,
  fallback: ActionErrorCode
): Promise<string> {
  const { translatedMessage } = baErrorInfo(error);
  if (translatedMessage) {
    return translatedMessage;
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
  return { success: false, error: dict.errors.action[code], code };
}

export async function toFormError(
  error: unknown,
  options: ActionErrorOptions
): Promise<{ status: "error"; error?: string; code?: string }> {
  const result = await toActionError(error, options);
  return { status: "error", error: result.error, code: result.code };
}

export async function formActionError(
  code: ActionErrorCode
): Promise<{ status: "error"; error: string; code: ActionErrorCode }> {
  const locale = await getLocaleFromRequest();
  const dict = await getDictionary(locale);
  return { status: "error", error: dict.errors.action[code], code };
}
