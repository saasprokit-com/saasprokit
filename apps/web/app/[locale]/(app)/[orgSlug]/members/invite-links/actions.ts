"use server";

import crypto from "node:crypto";
import { database } from "@repo/database";
import { ORG_AUDIT_ACTIONS } from "@repo/utils/audit";
import { MILLISECONDS_PER_DAY } from "@repo/utils/date";
import { INVITE_TOKEN_BYTES } from "@repo/utils/organization";
import { recordAudit } from "@/lib/audit/record";
import { actionError, toActionError } from "@/lib/auth/action-error";
import {
  type ActionResult,
  getServerSession,
  hasOrgPermission,
} from "@/lib/auth/auth";
import { env } from "@/lib/env";
import { type FormState, fieldErrorsFrom } from "@/lib/forms";
import { revalidateOrgPage } from "@/lib/infrastructure/revalidation";
import { ORG_PAGES } from "@/lib/routes";
import {
  type CreateInviteLinkInput,
  createInviteLinkSchema,
  type InviteLinkIdInput,
  inviteLinkIdSchema,
  type RevokeInviteLinksInput,
  revokeInviteLinksSchema,
} from "./schemas";

export type CreateInviteLinkFormState = FormState<
  CreateInviteLinkInput,
  { token: string; url: string }
>;

export async function createInviteLinkAction(
  _prevState: CreateInviteLinkFormState,
  input: CreateInviteLinkInput
): Promise<CreateInviteLinkFormState> {
  const parsed = createInviteLinkSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    const validated = parsed.data;

    const allowed = await hasOrgPermission(validated.organizationId, {
      invitation: ["create"],
    });
    if (!allowed) {
      return actionError("unauthorized");
    }

    const session = await getServerSession();
    if (!session) {
      return actionError("unauthorized");
    }

    const token = crypto.randomBytes(INVITE_TOKEN_BYTES).toString("hex");
    const expiresAt = new Date(
      Date.now() + validated.expiresInDays * MILLISECONDS_PER_DAY
    );

    await database.inviteLink.create({
      data: {
        organizationId: validated.organizationId,
        token,
        role: validated.role,
        expiresAt,
        maxUses: validated.maxUses || null,
        createdById: session.user.id,
      },
    });

    await recordAudit({
      action: ORG_AUDIT_ACTIONS.INVITE_LINK_CREATE,
      actorId: session.user.id,
      changes: {
        expiresAt: expiresAt.toISOString(),
        maxUses: validated.maxUses || null,
        role: validated.role,
      },
      organizationId: validated.organizationId,
    });

    const url = `${env.BETTER_AUTH_URL}/invite/${token}`;

    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.MEMBERS);
    return { status: "success", data: { token, url } };
  } catch (error) {
    return toActionError(error, { fallback: "createInviteLink" });
  }
}

export async function revokeInviteLinkAction(
  input: InviteLinkIdInput
): Promise<ActionResult> {
  try {
    const validated = inviteLinkIdSchema.parse(input);

    const allowed = await hasOrgPermission(validated.organizationId, {
      invitation: ["cancel"],
    });
    if (!allowed) {
      return actionError("unauthorized");
    }

    const inviteLink = await database.inviteLink.findFirst({
      where: {
        id: validated.inviteLinkId,
        organizationId: validated.organizationId,
        isActive: true,
      },
    });

    if (!inviteLink) {
      return actionError("notFound");
    }

    await database.inviteLink.update({
      where: { id: inviteLink.id },
      data: { isActive: false },
    });

    await recordAudit({
      action: ORG_AUDIT_ACTIONS.INVITE_LINK_REVOKE,
      changes: { inviteLinkId: inviteLink.id },
      organizationId: validated.organizationId,
    });

    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.MEMBERS);
    return { success: true };
  } catch (error) {
    return toActionError(error, { fallback: "revokeInviteLink" });
  }
}

export async function revokeInviteLinksAction(
  input: RevokeInviteLinksInput,
  _prevState: ActionResult<{ revokedCount: number }> | null,
  _formData: FormData
): Promise<ActionResult<{ revokedCount: number }>> {
  try {
    const validated = revokeInviteLinksSchema.parse(input);

    const allowed = await hasOrgPermission(validated.organizationId, {
      invitation: ["cancel"],
    });
    if (!allowed) {
      return actionError("unauthorized");
    }

    const activeInviteLinks = await database.inviteLink.findMany({
      select: { id: true },
      where: {
        id: { in: validated.inviteLinkIds },
        isActive: true,
        organizationId: validated.organizationId,
      },
    });

    if (activeInviteLinks.length === 0) {
      return actionError("noActiveInviteLinks");
    }

    const activeInviteLinkIds = activeInviteLinks.map((link) => link.id);

    const result = await database.inviteLink.updateMany({
      data: { isActive: false },
      where: { id: { in: activeInviteLinkIds } },
    });

    await recordAudit({
      action: ORG_AUDIT_ACTIONS.INVITE_LINK_REVOKE,
      changes: {
        inviteLinkIds: activeInviteLinkIds,
        revokedCount: result.count,
      },
      organizationId: validated.organizationId,
    });

    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.MEMBERS);
    return { success: true, data: { revokedCount: result.count } };
  } catch (error) {
    return toActionError(error, { fallback: "revokeInviteLinks" });
  }
}
