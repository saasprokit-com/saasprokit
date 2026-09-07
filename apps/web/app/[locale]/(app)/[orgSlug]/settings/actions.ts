"use server";

import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { createRequestLogger } from "@repo/logger/log";
import { imageFileSchema } from "@repo/storage/constants";
import { ATTACHABLE_TYPE } from "@repo/utils/storage";
import { headers } from "next/headers";
import type { z } from "zod";
import { verifySession } from "@/lib/auth/action-auth";
import { actionError, toActionError } from "@/lib/auth/action-error";
import { type ActionResult, hasOrgPermission } from "@/lib/auth/auth";
import {
  deleteStoredObjects,
  storeOrganizationLogo,
} from "@/lib/files/actions";
import { validateStorageQuota } from "@/lib/files/storage-quota";
import { type FormState, fieldErrorsFrom } from "@/lib/forms";
import { revalidateOrgPage } from "@/lib/infrastructure/revalidation";
import { ORG_PAGES } from "@/lib/routes";
import {
  deleteOrgActionSchema,
  removeLogoSchema,
  updateOrgActionSchema,
  uploadLogoSchema,
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

    const attached = {
      attachableType: ATTACHABLE_TYPE.ORGANIZATION,
      attachableId: validated.organizationId,
      deletedAt: null,
    };
    const [replaced, , organization] = await database.$transaction([
      database.file.findMany({
        where: attached,
        select: { storagePath: true, bucket: true },
      }),
      database.file.updateMany({
        where: attached,
        data: { deletedAt: new Date() },
      }),
      database.organization.update({
        where: { id: validated.organizationId },
        data: { logo: null },
        select: { slug: true },
      }),
    ]);

    await revalidateOrgPage(organization.slug, ORG_PAGES.SETTINGS);
    await deleteStoredObjects(replaced, logger);

    return { success: true };
  } catch (error) {
    return toActionError(error, { fallback: "removeLogo", logger });
  }
}

export async function uploadOrganizationLogoAction(
  formData: FormData
): Promise<ActionResult<{ publicUrl: string | null }>> {
  const logger = createRequestLogger({ action: "uploadOrganizationLogo" });

  try {
    const { session, error } = await verifySession<{
      publicUrl: string | null;
    }>();
    if (error) {
      return error;
    }

    const validated = uploadLogoSchema.parse({
      organizationId: formData.get("organizationId"),
    });
    const file = imageFileSchema.parse(formData.get("file"));

    const allowed = await hasOrgPermission(validated.organizationId, {
      organization: ["update"],
    });
    if (!allowed) {
      return actionError("unauthorized");
    }

    const quota = await validateStorageQuota(
      validated.organizationId,
      file.size,
      logger
    );
    if (!quota.valid) {
      return { success: false, error: quota.error, code: "storageQuota" };
    }

    const { publicUrl, slug } = await storeOrganizationLogo({
      file,
      organizationId: validated.organizationId,
      uploadedById: session.user.id,
      logger,
    });

    await revalidateOrgPage(slug, ORG_PAGES.SETTINGS);

    logger.info("Organization logo uploaded", {
      organizationId: validated.organizationId,
      userId: session.user.id,
      publicUrl,
    });

    return { success: true, data: { publicUrl } };
  } catch (error) {
    return toActionError(error, { fallback: "uploadLogo", logger });
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
    const organization = await auth.api.updateOrganization({
      headers: await headers(),
      body: {
        data: { name: parsed.data.name },
        organizationId: parsed.data.organizationId,
      },
    });
    if (!organization) {
      return actionError("orgNotFound");
    }

    await revalidateOrgPage(organization.slug, ORG_PAGES.SETTINGS);

    return { status: "success" };
  } catch (error) {
    return toActionError(error, { fallback: "updateOrganization", logger });
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
