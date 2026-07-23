"use server";

import { database } from "@repo/database";
import { createRequestLogger } from "@repo/logger/server";
import { ACTIVE_STATUSES } from "@repo/utils/payment";
import { ATTACHABLE_TYPE } from "@repo/utils/storage";
import { actionError, toActionError } from "@/lib/auth/action-error";
import { hasAdminPermission } from "@/lib/auth/admin";
import { type ActionResult, getServerSession } from "@/lib/auth/auth";
import { revalidateAdminPage } from "@/lib/infrastructure/revalidation";
import { ADMIN_PAGES } from "@/lib/routes";
import {
  ADMIN_AUDIT_ACTIONS,
  buildAdminAuditData,
} from "@/servers/admin/audit";
import {
  type DeleteOrganizationInput,
  deleteOrganizationSchema,
} from "./schemas";

/**
 * Pure Prisma — Better Auth's deleteOrganization requires the caller to be a
 * member of the target org, which a platform admin generally is not. Blocks
 * deletion while any subscription for the org is in an active status; cleans up
 * the columns that have no FK cascade (subscriptions by referenceId, users'
 * defaultOrganizationId, sessions' active org/team, org-attached files).
 */
export async function deleteOrganizationAction(
  input: DeleteOrganizationInput
): Promise<ActionResult> {
  const logger = createRequestLogger({ action: "deleteOrganization" });
  try {
    const { organizationId } = deleteOrganizationSchema.parse(input);

    const session = await getServerSession();
    if (!session?.user?.id) {
      return actionError("unauthorized");
    }
    if (!(await hasAdminPermission({ organization: ["delete"] }))) {
      return actionError("unauthorized");
    }
    const actorId = session.user.id;

    const org = await database.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, slug: true },
    });
    if (!org) {
      return actionError("orgNotFound");
    }

    const active = await database.subscription.findFirst({
      where: {
        referenceId: organizationId,
        status: { in: [...ACTIVE_STATUSES] },
      },
      select: { id: true },
    });
    if (active) {
      return actionError("orgHasActiveSubscription");
    }

    const auditData = await buildAdminAuditData({
      actorId,
      action: ADMIN_AUDIT_ACTIONS.DELETE_ORG,
      changes: { organizationId, slug: org.slug },
    });

    await database.$transaction([
      // No FK on referenceId — would orphan otherwise.
      database.subscription.deleteMany({
        where: { referenceId: organizationId },
      }),
      database.user.updateMany({
        where: { defaultOrganizationId: organizationId },
        data: { defaultOrganizationId: null },
      }),
      database.session.updateMany({
        where: { activeOrganizationId: organizationId },
        data: { activeOrganizationId: null, activeTeamId: null },
      }),
      // Soft-delete org-attached files (repo files convention).
      database.file.updateMany({
        where: {
          attachableType: ATTACHABLE_TYPE.ORGANIZATION,
          attachableId: organizationId,
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      }),
      // FK cascades: Member, Invitation, InviteLink, Team → TeamMember.
      database.organization.delete({ where: { id: organizationId } }),
      // Atomic audit — rolls back with the delete if anything above fails.
      database.auditLog.create({ data: auditData }),
    ]);

    await revalidateAdminPage(ADMIN_PAGES.ORGANIZATIONS);
    return { success: true };
  } catch (error) {
    return toActionError(error, { fallback: "deleteOrganization", logger });
  }
}
