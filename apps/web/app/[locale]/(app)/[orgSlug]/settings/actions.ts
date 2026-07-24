"use server";

import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { createRequestLogger } from "@repo/logger/server";
import { ATTACHABLE_TYPE } from "@repo/utils/storage";
import { headers } from "next/headers";
import type { z } from "zod";
import {
  actionError,
  formActionError,
  toActionError,
  toFormError,
} from "@/lib/auth/action-error";
import { type ActionResult, hasOrgPermission } from "@/lib/auth/auth";
import { type FormState, fieldErrorsFrom } from "@/lib/forms";
import { revalidateOrgPage } from "@/lib/infrastructure/revalidation";
import { ORG_PAGES } from "@/lib/routes";
import {
  deleteOrgActionSchema,
  removeLogoSchema,
  updateOrgActionSchema,
} from "./schemas";

export async function removeOrganizationLogoAction(
  input: z.infer<typeof removeLogoSchema>
): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "removeOrganizationLogo" });

  try {
    const validated = removeLogoSchema.parse(input);

    const allowed = await hasOrgPermission(validated.organizationId, {
      organization: ["update"],
    });
    if (!allowed) {
      return actionError("unauthorized");
    }

    const organization = await database.organization.findUnique({
      where: { id: validated.organizationId },
      select: { slug: true },
    });

    if (!organization) {
      return actionError("orgNotFound");
    }

    // Atomically: soft-delete attached logo files + clear the org logo reference
    await database.$transaction([
      database.file.updateMany({
        where: {
          attachableType: ATTACHABLE_TYPE.ORGANIZATION,
          attachableId: validated.organizationId,
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      }),
      database.organization.update({
        where: { id: validated.organizationId },
        data: { logo: null },
      }),
    ]);

    await revalidateOrgPage(organization.slug, ORG_PAGES.SETTINGS);

    return { success: true };
  } catch (error) {
    return toActionError(error, { fallback: "removeLogo", logger });
  }
}

export type UpdateOrgFormState = FormState<
  z.infer<typeof updateOrgActionSchema>
>;

export async function updateOrganizationAction(
  _prevState: UpdateOrgFormState,
  input: z.infer<typeof updateOrgActionSchema>
): Promise<UpdateOrgFormState> {
  const logger = createRequestLogger({ action: "updateOrganization" });

  const parsed = updateOrgActionSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    // Permission (organization:update) is enforced by BA's updateOrganization itself.
    const organization = await database.organization.findUnique({
      where: { id: parsed.data.organizationId },
      select: { slug: true },
    });

    if (!organization) {
      return formActionError("orgNotFound");
    }

    await auth.api.updateOrganization({
      headers: await headers(),
      body: {
        data: { name: parsed.data.name },
        organizationId: parsed.data.organizationId,
      },
    });

    await revalidateOrgPage(organization.slug, ORG_PAGES.SETTINGS);

    return { status: "success" };
  } catch (error) {
    return toFormError(error, { fallback: "updateOrganization", logger });
  }
}

export async function deleteOrganizationAction(
  input: z.infer<typeof deleteOrgActionSchema>,
  _prevState: ActionResult | null,
  _formData: FormData
): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "deleteOrganization" });

  try {
    const validated = deleteOrgActionSchema.parse(input);

    // Permission (organization:delete) is enforced by BA's deleteOrganization itself.
    await auth.api.deleteOrganization({
      headers: await headers(),
      body: { organizationId: validated.organizationId },
    });

    return { success: true };
  } catch (error) {
    return toActionError(error, { fallback: "deleteOrganization", logger });
  }
}
