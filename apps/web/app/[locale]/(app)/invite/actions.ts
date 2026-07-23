"use server";

import type { OrgRoleName } from "@repo/auth/permissions";
import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { INVITATION_STATUS } from "@repo/utils/organization";
import { headers } from "next/headers";
import type { z } from "zod";
import { actionError, toActionError } from "@/lib/auth/action-error";
import type { ActionResult } from "@/lib/auth/auth";
import { getServerSession } from "@/lib/auth/auth";
import { canOrgAddMember } from "@/lib/billing/subscription-queries";
import { acceptInvitationSchema, acceptInviteLinkSchema } from "./schemas";

async function handleExistingMember(
  invitationId: string,
  organizationId: string
): Promise<ActionResult<{ organizationSlug: string }>> {
  await database.invitation.update({
    where: { id: invitationId },
    data: { status: INVITATION_STATUS.ACCEPTED },
  });
  const org = await database.organization.findUnique({
    where: { id: organizationId },
    select: { slug: true },
  });
  if (!org) {
    return actionError("orgNoLongerExists");
  }
  return {
    success: true,
    data: { organizationSlug: org.slug },
  };
}

export async function acceptInvitationAction(
  input: z.infer<typeof acceptInvitationSchema>
): Promise<ActionResult<{ organizationSlug: string }>> {
  try {
    const validated = acceptInvitationSchema.parse(input);

    const session = await getServerSession();

    if (!session?.user?.id) {
      return actionError("signInRequired");
    }

    const invitation = await database.invitation.findUnique({
      where: { id: validated.invitationId },
      select: { organizationId: true, email: true },
    });

    if (!invitation) {
      return actionError("notFound");
    }

    if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return actionError("unauthorized");
    }

    // Pre-check: if already a member, handle gracefully
    const existingMember = await database.member.findFirst({
      where: {
        organizationId: invitation.organizationId,
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (existingMember) {
      return handleExistingMember(
        validated.invitationId,
        invitation.organizationId
      );
    }

    // Check member capacity before accepting
    const memberCheck = await canOrgAddMember(invitation.organizationId);
    if (!memberCheck.allowed) {
      return actionError("memberLimitReached");
    }

    // Delegate to BA — handles email match, expiry, status, member creation
    const result = await auth.api.acceptInvitation({
      body: { invitationId: validated.invitationId },
      headers: await headers(),
    });

    if (!result) {
      return actionError("acceptInvitation");
    }

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

    // Already a member — send them into the org instead of erroring (mirrors
    // acceptInvitationAction). No use consumed and no seat check needed.
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

    // Plan seat cap (Stripe) — Better Auth has no billing concept.
    const memberCheck = await canOrgAddMember(inviteLink.organizationId);
    if (!memberCheck.allowed) {
      return actionError("memberLimitReached");
    }

    // Better Auth owns the membership write: it validates duplicates, enforces
    // its own membership limit, and runs member-creation hooks.
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
    // (seat cap, or a concurrent duplicate) never burns a use. maxUses is a
    // best-effort cap: two simultaneous joins can exceed it by one, which is
    // fine for a shared link.
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
