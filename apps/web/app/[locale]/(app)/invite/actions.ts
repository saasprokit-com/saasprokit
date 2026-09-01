"use server";

import type { OrgRoleName } from "@repo/auth/permissions";
import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { headers } from "next/headers";
import type { z } from "zod";
import { actionError, toActionError } from "@/lib/auth/action-error";
import type { ActionResult } from "@/lib/auth/auth";
import { getServerSession } from "@/lib/auth/auth";
import { canOrgAddMember } from "@/lib/billing/subscription-queries";
import { acceptInvitationSchema, acceptInviteLinkSchema } from "./schemas";

export async function acceptInvitationAction(
  input: z.infer<typeof acceptInvitationSchema>
): Promise<ActionResult<{ organizationSlug: string }>> {
  try {
    const validated = acceptInvitationSchema.parse(input);

    const result = await auth.api.acceptInvitation({
      body: { invitationId: validated.invitationId },
      headers: await headers(),
    });

    const org = await database.organization.findUnique({
      where: { id: result.member.organizationId },
      select: { slug: true },
    });

    if (!org) {
      return actionError("orgNoLongerExists");
    }

    return { success: true, data: { organizationSlug: org.slug } };
  } catch (error) {
    return toActionError(error, {
      fallback: "acceptInvitation",
    });
  }
}

export async function acceptInvitationFormAction(
  _prevState: ActionResult<{ organizationSlug: string }>,
  formData: FormData
): Promise<ActionResult<{ organizationSlug: string }>> {
  const invitationId = formData.get("invitationId") as string;
  return await acceptInvitationAction({ invitationId });
}

export async function acceptInviteLinkAction(
  input: z.infer<typeof acceptInviteLinkSchema>
): Promise<ActionResult<{ organizationSlug: string }>> {
  try {
    const validated = acceptInviteLinkSchema.parse(input);

    const session = await getServerSession();

    if (!session?.user?.id) {
      return actionError("signInRequired");
    }

    const inviteLink = await database.inviteLink.findUnique({
      where: { token: validated.token },
      include: {
        organization: {
          select: { slug: true },
        },
      },
    });

    if (!inviteLink) {
      return actionError("invalidInviteLink");
    }
    if (!inviteLink.isActive) {
      return actionError("inviteLinkRevoked");
    }
    if (inviteLink.expiresAt && inviteLink.expiresAt < new Date()) {
      return actionError("inviteLinkExpired");
    }
    if (
      inviteLink.maxUses !== null &&
      inviteLink.usedCount >= inviteLink.maxUses
    ) {
      return actionError("inviteLinkUsageLimitReached");
    }

    // Shared links are idempotent for existing members: no use is consumed and
    // no seat-capacity check is needed.
    const existingMember = await database.member.findFirst({
      where: {
        organizationId: inviteLink.organizationId,
        userId: session.user.id,
      },
      select: { id: true },
    });
    if (existingMember) {
      return {
        success: true,
        data: { organizationSlug: inviteLink.organization.slug },
      };
    }

    // Pending email invitations also reserve plan seats.
    const memberCheck = await canOrgAddMember(inviteLink.organizationId);
    if (!memberCheck.allowed) {
      return actionError("memberLimitReached");
    }

    await auth.api.addMember({
      body: {
        userId: session.user.id,
        organizationId: inviteLink.organizationId,
        // Validated to admin|member at link creation (invite-links schema).
        role: inviteLink.role as OrgRoleName,
      },
      headers: await headers(),
    });

    // Consume a use only after the member is actually added, so a failed join
    // does not burn a use. maxUses remains a best-effort cap: concurrent joins
    // can exceed it, which is accepted for a shared link.
    await database.inviteLink.update({
      where: { id: inviteLink.id },
      data: { usedCount: { increment: 1 } },
    });

    return {
      success: true,
      data: { organizationSlug: inviteLink.organization.slug },
    };
  } catch (error) {
    return toActionError(error, { fallback: "joinOrganization" });
  }
}

export async function acceptInviteLinkFormAction(
  _prevState: ActionResult<{ organizationSlug: string }>,
  formData: FormData
): Promise<ActionResult<{ organizationSlug: string }>> {
  const token = formData.get("token") as string;
  return await acceptInviteLinkAction({ token });
}
