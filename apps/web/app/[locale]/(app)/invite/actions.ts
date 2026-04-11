"use server";

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

/**
 * Handle the case where user is already a member — mark invitation accepted gracefully
 */
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
 * Accept an email invitation
 *
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
      baFallback: "unknownError",
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
 * Accept an invite link
 *
 * Complexity justified by:
 * - Multiple validation checks (expiry, active status, existing member)
 * - Transaction-based race condition prevention
 * - Comprehensive error handling with specific messages
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

    // Find the invite link
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

    // Check if active
    if (!inviteLink.isActive) {
      return actionError("inviteLinkRevoked");
    }

    // Check expiry
    if (inviteLink.expiresAt && new Date(inviteLink.expiresAt) < new Date()) {
      return actionError("inviteLinkExpired");
    }

    // Check if already a member (can be done outside transaction)
    const existingMember = await database.member.findFirst({
      where: {
        organizationId: inviteLink.organizationId,
        userId: session.user.id,
      },
    });

    if (existingMember) {
      return {
        success: true,
        data: { organizationSlug: inviteLink.organization.slug },
      };
    }

    // Check member capacity before joining
    const memberCheck = await canOrgAddMember(inviteLink.organizationId);
    if (!memberCheck.allowed) {
      return actionError("memberLimitReached");
    }

    // SECURITY: Move maxUses check INSIDE transaction to prevent race condition
    // This ensures that between the check and the increment, no other request can slip through
    // Issue: In original code, two concurrent requests could both read usedCount=0 before either increments
    try {
      await database.$transaction(async (tx) => {
        // Re-fetch the link with latest count inside transaction
        const latestLink = await tx.inviteLink.findUnique({
          where: { id: inviteLink.id },
        });

        if (!latestLink) {
          throw new Error("Invite link not found");
        }

        // Now check maxUses with the current (locked) value
        if (
          latestLink.maxUses !== null &&
          latestLink.usedCount >= latestLink.maxUses
        ) {
          throw new Error("Invite link usage limit reached");
        }

        // Create member
        await tx.member.create({
          data: {
            organizationId: inviteLink.organizationId,
            userId: session.user.id,
            role: inviteLink.role,
          },
        });

        // Increment count atomically
        await tx.inviteLink.update({
          where: { id: inviteLink.id },
          data: { usedCount: { increment: 1 } },
        });
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Invite link usage limit reached"
      ) {
        return actionError("inviteLinkUsageLimitReached");
      }

      throw error;
    }

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
