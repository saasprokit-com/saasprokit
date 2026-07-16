"use server";

import { ORG_ROLES } from "@repo/auth/permissions";
import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { INVITATION_STATUS } from "@repo/utils/organization";
import { headers } from "next/headers";
import { actionError, toActionError } from "@/lib/auth/action-error";
import { type ActionResult, hasOrgPermission } from "@/lib/auth/auth";
import { revalidateOrgPage } from "@/lib/infrastructure/revalidation";
import { ORG_PAGES } from "@/lib/routes";
import {
  type CancelInvitationsInput,
  cancelInvitationsSchema,
  type InvitationIdInput,
  invitationIdSchema,
} from "./schemas";

/**
 * Resend invitation email
 *
 * Uses BA's inviteMember with resend: true, which extends expiry
 * and re-triggers the sendInvitationEmail callback.
 */
export async function resendInvitationAction(
  input: InvitationIdInput
): Promise<ActionResult> {
  try {
    const validated = invitationIdSchema.parse(input);

    const allowed = await hasOrgPermission(validated.organizationId, {
      invitation: ["create"],
    });
    if (!allowed) {
      return actionError("unauthorized");
    }

    // Bridge: action receives invitationId, but BA needs email + role
    const invitation = await database.invitation.findFirst({
      where: {
        id: validated.invitationId,
        organizationId: validated.organizationId,
        status: INVITATION_STATUS.PENDING,
      },
      select: { email: true, role: true },
    });

    if (!invitation) {
      return actionError("notFound");
    }

    const roleValue = invitation.role || ORG_ROLES.MEMBER;
    if (roleValue !== ORG_ROLES.ADMIN && roleValue !== ORG_ROLES.MEMBER) {
      return actionError("invalidRole");
    }

    await auth.api.createInvitation({
      body: {
        email: invitation.email,
        role: roleValue,
        organizationId: validated.organizationId,
        resend: true,
      },
      headers: await headers(),
    });

    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.MEMBERS);
    return { success: true };
  } catch (error) {
    return toActionError(error, {
      fallback: "invalidInput",
      baFallback: "resendInvitation",
    });
  }
}

/**
 * Cancel a pending invitation
 *
 * Delegates to BA's cancelInvitation API which handles permission checks.
 * Pre-checks pending status since BA doesn't validate status before canceling.
 */
export async function cancelInvitationAction(
  input: InvitationIdInput
): Promise<ActionResult> {
  try {
    const validated = invitationIdSchema.parse(input);

    const allowed = await hasOrgPermission(validated.organizationId, {
      invitation: ["cancel"],
    });
    if (!allowed) {
      return actionError("unauthorized");
    }

    // Pre-check: only cancel pending invitations
    const invitation = await database.invitation.findFirst({
      where: {
        id: validated.invitationId,
        organizationId: validated.organizationId,
        status: INVITATION_STATUS.PENDING,
      },
      select: { id: true },
    });

    if (!invitation) {
      return actionError("notFound");
    }

    await auth.api.cancelInvitation({
      body: { invitationId: validated.invitationId },
      headers: await headers(),
    });

    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.MEMBERS);
    return { success: true };
  } catch (error) {
    return toActionError(error, {
      fallback: "invalidInput",
      baFallback: "cancelInvitation",
    });
  }
}

/**
 * Cancel multiple pending invitations
 */
export async function cancelInvitationsAction(
  input: CancelInvitationsInput
): Promise<ActionResult<{ cancelledCount: number; failedCount: number }>> {
  try {
    const validated = cancelInvitationsSchema.parse(input);

    const allowed = await hasOrgPermission(validated.organizationId, {
      invitation: ["cancel"],
    });
    if (!allowed) {
      return actionError("unauthorized");
    }

    // Fetch only pending invitations that belong to this org
    const pendingInvitations = await database.invitation.findMany({
      where: {
        id: { in: validated.invitationIds },
        organizationId: validated.organizationId,
        status: INVITATION_STATUS.PENDING,
      },
      select: { id: true },
    });

    if (pendingInvitations.length === 0) {
      return actionError("noPendingInvitations");
    }

    const reqHeaders = await headers();

    // Cancel each via BA API (handles status update + side effects)
    const results = await Promise.allSettled(
      pendingInvitations.map((inv) =>
        auth.api.cancelInvitation({
          body: { invitationId: inv.id },
          headers: reqHeaders,
        })
      )
    );

    const cancelledCount = results.filter(
      (r) => r.status === "fulfilled"
    ).length;
    const failedCount = results.length - cancelledCount;

    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.MEMBERS);
    return { success: true, data: { cancelledCount, failedCount } };
  } catch (error) {
    return toActionError(error, {
      fallback: "cancelInvitations",
      baFallback: "cancelInvitation",
    });
  }
}
