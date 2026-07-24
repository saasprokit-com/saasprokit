import { useEffect } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import type { FormFieldErrors } from "@/lib/forms";

export function useActionFieldErrors<TValues extends FieldValues>(
  form: UseFormReturn<TValues>,
  state: { fieldErrors?: FormFieldErrors<TValues> }
): void {
  useEffect(() => {
    if (!state.fieldErrors) {
      return;
    }
    for (const [field, message] of Object.entries(state.fieldErrors)) {
      if (message) {
        form.setError(field as Path<TValues>, { type: "server", message });
      }
    }
  }, [state, form]);
}
