"use server";

import { auth } from "@repo/auth/server";
import { headers } from "next/headers";
import { actionError, toActionError } from "@/lib/auth/action-error";
import { type FormState, fieldErrorsFrom } from "@/lib/forms";
import { revalidateAccountPage } from "@/lib/infrastructure/revalidation";
import { type ProfileFormValues, profileSchema } from "./schemas";

export type ProfileFormState = FormState<ProfileFormValues>;

// The form doesn't submit an image yet; when provided it passes through to
// Better Auth unchanged.
interface UpdateProfileInput extends ProfileFormValues {
  image?: string | null;
}

export async function updateProfileAction(
  _prevState: ProfileFormState,
  input: UpdateProfileInput
): Promise<ProfileFormState> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    const { name } = parsed.data;
    const { image } = input;

    // Validate image URL if provided
    if (image) {
      try {
        const url = new URL(image);
        if (url.protocol !== "https:" && url.protocol !== "http:") {
          return actionError("invalidImageUrl");
        }
      } catch {
        return actionError("invalidImageUrl");
      }
    }

    await auth.api.updateUser({
      headers: await headers(),
      body: {
        name,
        ...(image && { image }),
      },
    });

    await revalidateAccountPage("profile");

    return { status: "success" };
  } catch (error) {
    return toActionError(error, {
      fallback: "updateProfile",
    });
  }
}
