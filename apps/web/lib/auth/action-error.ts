import "server-only";

import type { Dictionary } from "@repo/internationalization";
import { getDictionary } from "@repo/internationalization";
import { getLocaleFromRequest } from "@/lib/infrastructure/revalidation";

export type ActionErrorCode = keyof Dictionary["errors"]["action"];

// Carries both discriminants so one helper pair serves every action: assignable
// to ActionResult (reads `success`) and to FormState (reads `status`) alike.
export interface ActionFailure {
  code: string;
  error: string;
  status: "error";
  success: false;
}

interface ActionErrorOptions {
  fallback: ActionErrorCode;
  logger?: { error: (msg: string, data?: Record<string, unknown>) => void };
  logMessage?: string;
}

interface BaErrorInfo {
  code?: string;
  translatedMessage?: string;
}

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

export async function toActionError(
  error: unknown,
  options: ActionErrorOptions
): Promise<ActionFailure> {
  const locale = await getLocaleFromRequest();
  const dict = await getDictionary(locale);

  // 1. ZodError — return first validation issue (Zod messages are already user-facing)
  if (error != null && typeof error === "object" && "issues" in error) {
    const zodError = error as { issues: Array<{ message: string }> };
    return {
      success: false,
      status: "error",
      error: zodError.issues[0]?.message ?? dict.errors.action.invalidInput,
      code: "invalidInput",
    };
  }

  // 2. Log error if logger provided
  if (options.logger) {
    options.logger.error(
      options.logMessage ?? dict.errors.action[options.fallback],
      { err: error instanceof Error ? error : new Error(String(error)) }
    );
  }

  const { code: baCode, translatedMessage } = baErrorInfo(error);
  // BA body.code survives even when the message was not translated, so
  // callers can branch on it while the user still sees the dictionary text.
  const code = baCode ?? options.fallback;

  // 3. Better Auth APIError already localized by the i18n plugin
  if (translatedMessage) {
    return { success: false, status: "error", error: translatedMessage, code };
  }

  // 4. Generic fallback from action error dictionary
  return {
    success: false,
    status: "error",
    error: dict.errors.action[options.fallback],
    code,
  };
}

export async function actionError(
  code: ActionErrorCode
): Promise<ActionFailure> {
  const locale = await getLocaleFromRequest();
  const dict = await getDictionary(locale);
  return {
    success: false,
    status: "error",
    error: dict.errors.action[code],
    code,
  };
}
