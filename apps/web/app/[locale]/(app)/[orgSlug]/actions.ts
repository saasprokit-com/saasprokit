"use server";

import { database } from "@repo/database";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/auth/action-auth";
import { toActionError } from "@/lib/auth/action-error";
import type { ActionResult } from "@/lib/auth/auth";
import {
  buildLocalePath,
  getLocaleFromRequest,
} from "@/lib/infrastructure/revalidation";
import { validateOrganizationMembership } from "@/servers/organization/queries";

export async function setDefaultWorkspaceAction(
  organizationId: string
): Promise<ActionResult> {
  try {
    const { session, error } = await verifySession();
    if (error) {
      return error;
    }

    const isMember = await validateOrganizationMembership(
      organizationId,
      session.user.id
    );

    if (!isMember) {
      throw new Error("Not a member of this organization");
    }

    await database.user.update({
      where: { id: session.user.id },
      data: { defaultOrganizationId: organizationId },
    });

    const locale = await getLocaleFromRequest();
    revalidatePath(buildLocalePath(locale, "/"));
    return { success: true };
  } catch (error) {
    return toActionError(error, { fallback: "setDefault" });
  }
}
