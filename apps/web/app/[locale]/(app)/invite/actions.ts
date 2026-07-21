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

/**
 * Handles "already a member" gracefully before delegating to BA's acceptInvitation API.
 * BA handles: email match, expiry check, status check, member creation, invitation update.
 */
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

    // SECURITY: Verify the logged-in user's email matches the invitation email
    // Prevents unauthorized acceptance of invitations meant for other users
    // session.user.email is guaranteed non-null here (checked at line 52)
    if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return actionError("unauthorized");
    }

    // Pre-check: if already a member, handle gracefully
    const existingMember = await database.member.findFirst({
      where: {
        organizationId: invitation.organizationId,
        userId: session.user.id,
      },
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

/**
 * Form-adapted wrapper for useActionState compatibility.
 * Extracts invitationId from FormData and delegates to acceptInvitationAction.
 */
export async function acceptInvitationFormAction(
  _prevState: ActionResult<{ organizationSlug: string }>,
  formData: FormData
): Promise<ActionResult<{ organizationSlug: string }>> {
  const invitationId = formData.get("invitationId") as string;
  return await acceptInvitationAction({ invitationId });
}

/**
 * The invite-link rules (active, expiry, maxUses) are this app's own feature, so
 * they are checked here; `canOrgAddMember` is the Stripe plan seat cap. Better
 * Auth owns the membership write via `addMember`, which validates duplicates and
 * its membership limit and runs member hooks.
 */
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
          select: { id: true, slug: true, name: true },
        },
      },
    });

    if (!inviteLink) {
      return actionError("invalidInviteLink");
    }
    if (!inviteLink.isActive) {
      return actionError("inviteLinkRevoked");
    }
    if (inviteLink.expiresAt && new Date(inviteLink.expiresAt) < new Date()) {
      return actionError("inviteLinkExpired");
    }
    if (
      inviteLink.maxUses !== null &&
      inviteLink.usedCount >= inviteLink.maxUses
    ) {
      return actionError("inviteLinkUsageLimitReached");
    }

    // Plan seat cap (Stripe) — Better Auth has no billing concept.
    const memberCheck = await canOrgAddMember(inviteLink.organizationId);
    if (!memberCheck.allowed) {
      return actionError("memberLimitReached");
    }

    // Better Auth owns the membership: validates duplicates + its own
    // membership limit and runs member-creation hooks.
    await auth.api.addMember({
      body: {
        userId: session.user.id,
        organizationId: inviteLink.organizationId,
        // Validated to admin|member at link creation (invite-links schema).
        role: inviteLink.role as OrgRoleName,
      },
      headers: await headers(),
    });

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

/**
 * Form-adapted wrapper for useActionState compatibility.
 * Extracts token from FormData and delegates to acceptInviteLinkAction.
 */
export async function acceptInviteLinkFormAction(
  _prevState: ActionResult<{ organizationSlug: string }>,
  formData: FormData
): Promise<ActionResult<{ organizationSlug: string }>> {
  const token = formData.get("token") as string;
  return await acceptInviteLinkAction({ token });
}
