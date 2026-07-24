import type { FieldValues } from "react-hook-form";
import { z } from "zod";

export type FormStatus = "idle" | "success" | "error";

export type FormFieldErrors<TValues> = Partial<
  Record<Extract<keyof TValues, string>, string>
>;

export interface FormState<
  TValues extends FieldValues = FieldValues,
  TData = never,
> {
  /** BA SCREAMING_SNAKE code or app ActionErrorCode — namespaces never collide. */
  code?: string;
  data?: TData;
  error?: string;
  fieldErrors?: FormFieldErrors<TValues>;
  status: FormStatus;
}

export const initialFormState: FormState = { status: "idle" };

export function fieldErrorsFrom<TValues extends FieldValues>(
  error: z.ZodError
): FormFieldErrors<TValues> {
  const flattened: Record<string, string> = {};
  for (const [field, messages] of Object.entries(
    z.flattenError(error).fieldErrors
  )) {
    const first = (messages as string[] | undefined)?.[0];
    if (first) {
      flattened[field] = first;
    }
  }
  return flattened as FormFieldErrors<TValues>;
}
