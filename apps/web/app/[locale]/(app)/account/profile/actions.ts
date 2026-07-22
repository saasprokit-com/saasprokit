"use server";

import { auth } from "@repo/auth/server";
import { headers } from "next/headers";
import { actionError, toActionError } from "@/lib/auth/action-error";
import { revalidateAccountPage } from "@/lib/infrastructure/revalidation";
import { profileSchema } from "./schemas";

export async function updateProfileAction(formData: FormData) {
  try {
    const rawName = formData.get("name") as string;
    const image = formData.get("image") as string | null;

    const parsed = profileSchema.safeParse({ name: rawName });
    if (!parsed.success) {
      return actionError("nameTooShort");
    }

    const { name } = parsed.data;

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

    return { success: true };
  } catch (error) {
    return toActionError(error, {
      fallback: "updateProfile",
    });
  }
}
