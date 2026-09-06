"use server";

import { ORG_ROLES } from "@repo/auth/permissions";
import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { ORG_AUDIT_ACTIONS } from "@repo/utils/audit";
import { INVITATION_STATUS } from "@repo/utils/organization";
import { headers } from "next/headers";
import { recordAudit } from "@/lib/audit/record";
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

    await recordAudit({
      action: ORG_AUDIT_ACTIONS.INVITATION_RESEND,
      changes: {
        email: invitation.email,
        invitationId: validated.invitationId,
      },
      organizationId: validated.organizationId,
    });

    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.MEMBERS);
    return { success: true };
  } catch (error) {
    return toActionError(error, {
      fallback: "invalidInput",
    });
  }
}

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

    await recordAudit({
      action: ORG_AUDIT_ACTIONS.INVITATION_CANCEL,
      changes: { invitationId: validated.invitationId },
      organizationId: validated.organizationId,
    });

    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.MEMBERS);
    return { success: true };
  } catch (error) {
    return toActionError(error, {
      fallback: "invalidInput",
    });
  }
}

export interface CancelInvitationsResult {
  cancelledCount: number;
  failedCount: number;
}

export async function cancelInvitationsAction(
  input: CancelInvitationsInput,
  _prevState: ActionResult<CancelInvitationsResult> | null,
  _formData: FormData
): Promise<ActionResult<CancelInvitationsResult>> {
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

    if (cancelledCount > 0) {
      const cancelledInvitationIds = pendingInvitations
        .filter((_, index) => results[index]?.status === "fulfilled")
        .map((invitation) => invitation.id);

      await recordAudit({
        action: ORG_AUDIT_ACTIONS.INVITATION_CANCEL,
        changes: {
          cancelledCount,
          invitationIds: cancelledInvitationIds,
        },
        organizationId: validated.organizationId,
      });
    }

    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.MEMBERS);
    return { success: true, data: { cancelledCount, failedCount } };
  } catch (error) {
    return toActionError(error, {
      fallback: "cancelInvitations",
    });
  }
}
