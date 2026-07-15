"use server";

import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { createRequestLogger } from "@repo/logger/server";
import { ATTACHABLE_TYPE } from "@repo/utils/storage";
import { headers } from "next/headers";
import type { z } from "zod";
import { verifySession } from "@/lib/auth/action-auth";
import { actionError, toActionError } from "@/lib/auth/action-error";
import { type ActionResult, checkOrgPermission } from "@/lib/auth/auth";
import { revalidateOrgPage } from "@/lib/infrastructure/revalidation";
import { ORG_PAGES } from "@/lib/routes";
import {
  deleteOrgActionSchema,
  removeLogoSchema,
  revalidateOrgSettingsSchema,
  updateOrgActionSchema,
} from "./schemas";

export async function removeOrganizationLogoAction(
  input: z.infer<typeof removeLogoSchema>
): Promise<ActionResult> {
  try {
    const validated = removeLogoSchema.parse(input);

    const caller = await checkOrgPermission(validated.organizationId, {
      organization: ["update"],
    });
    if (!caller) {
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
    return toActionError(error, { fallback: "removeLogo" });
  }
}

export async function updateOrganizationAction(
  input: z.infer<typeof updateOrgActionSchema>
): Promise<ActionResult> {
  try {
    const validated = updateOrgActionSchema.parse(input);

    const caller = await checkOrgPermission(validated.organizationId, {
      organization: ["update"],
    });
    if (!caller) {
      return actionError("unauthorized");
    }

    const organization = await database.organization.findUnique({
      where: { id: validated.organizationId },
      select: { slug: true },
    });

    if (!organization) {
      return actionError("orgNotFound");
    }

    await auth.api.updateOrganization({
      headers: await headers(),
      body: {
        data: { name: validated.name },
        organizationId: validated.organizationId,
      },
    });

    await revalidateOrgPage(organization.slug, ORG_PAGES.SETTINGS);

    return { success: true };
  } catch (error) {
    return toActionError(error, { fallback: "updateOrganization" });
  }
}

export async function deleteOrganizationAction(
  input: z.infer<typeof deleteOrgActionSchema>
): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "deleteOrganization" });

  try {
    const validated = deleteOrgActionSchema.parse(input);

    const caller = await checkOrgPermission(validated.organizationId, {
      organization: ["delete"],
    });
    if (!caller) {
      return actionError("unauthorized");
    }

    await auth.api.deleteOrganization({
      headers: await headers(),
      body: { organizationId: validated.organizationId },
    });

    return { success: true };
  } catch (error) {
    return toActionError(error, { fallback: "deleteOrganization", logger });
  }
}

export async function revalidateOrgSettingsAction(
  input: z.infer<typeof revalidateOrgSettingsSchema>
): Promise<ActionResult> {
  try {
    const { error } = await verifySession();
    if (error) {
      return error;
    }

    const validated = revalidateOrgSettingsSchema.parse(input);
    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.SETTINGS);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to revalidate" };
  }
}
