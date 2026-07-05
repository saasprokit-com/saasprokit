"use server";

import crypto from "node:crypto";
import { ORG_ROLES } from "@repo/auth/permissions";
import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { MILLISECONDS_PER_DAY } from "@repo/utils/date";
import {
  BULK_INVITE_CONCURRENCY,
  INVITATION_STATUS,
  INVITE_TOKEN_BYTES,
} from "@repo/utils/organization";
import { headers } from "next/headers";
import { verifySession } from "@/lib/auth/action-auth";
import {
  type ActionErrorCode,
  actionError,
  toActionError,
} from "@/lib/auth/action-error";
import { type ActionResult, checkOrgPermission } from "@/lib/auth/auth";
import { mapBAError } from "@/lib/auth/ba-error";
import { canOrgAddMember } from "@/lib/billing/subscription-queries";
import { env } from "@/lib/env";
import { revalidateOrgPage } from "@/lib/infrastructure/revalidation";
import { ORG_PAGES } from "@/lib/routes";
import {
  type BulkInviteInput,
  bulkInviteSchema,
  type CancelInvitationsInput,
  type CreateInviteLinkInput,
  cancelInvitationsSchema,
  createInviteLinkSchema,
  type InvitationIdInput,
  type InviteLinkIdInput,
  type InviteMemberInput,
  invitationIdSchema,
  inviteLinkIdSchema,
  inviteMemberSchema,
  type ReactivateMemberInput,
  type RemoveMembersInput,
  type RevokeInviteLinksInput,
  reactivateMemberSchema,
  removeMembersSchema,
  revokeInviteLinksSchema,
  type SuspendMemberInput,
  suspendMemberSchema,
  type TransferOwnershipInput,
  transferOwnershipSchema,
  type UpdateRoleInput,
  updateRoleSchema,
} from "./schemas";

async function diagnoseMemberUpdateFailure(
  memberId: string,
  organizationId: string,
  callerId: string,
  operation: "role change" | "suspension"
): Promise<ActionErrorCode> {
  const member = await database.member.findFirst({
    where: { id: memberId, organizationId },
    select: { role: true, userId: true, suspendedAt: true },
  });

  if (!member) {
    return "memberNotFound";
  }
  if (member.role === ORG_ROLES.OWNER) {
    return operation === "suspension"
      ? "cannotSuspendOwner"
      : "cannotChangeOwnerRole";
  }
  if (member.userId === callerId) {
    return operation === "suspension"
      ? "cannotSuspendSelf"
      : "cannotChangeSelfRole";
  }
  if (operation === "suspension" && member.suspendedAt) {
    return "memberAlreadySuspended";
  }
  return operation === "suspension" ? "suspendMember" : "updateRole";
}

/**
 * Invite a new member to the organization
 *
 * Delegates to BA's inviteMember API which handles:
 * - Permission checks (via orgAc roles)
 * - Duplicate member/invitation detection
 * - Invitation record creation
 * - Email sending (via sendInvitationEmail callback)
 */
export async function inviteMemberAction(
  input: InviteMemberInput
): Promise<ActionResult<{ invitationId: string }>> {
  try {
    const validated = inviteMemberSchema.parse(input);

    // Defense-in-depth: verify permission before delegating to BA API
    const caller = await checkOrgPermission(validated.organizationId, {
      invitation: ["create"],
    });
    if (!caller) {
      return actionError("unauthorized");
    }

    const memberCheck = await canOrgAddMember(validated.organizationId);
    if (!memberCheck.allowed) {
      return actionError("memberLimitReached");
    }

    const invitation = await auth.api.createInvitation({
      body: {
        email: validated.email,
        role: validated.role,
        organizationId: validated.organizationId,
      },
      headers: await headers(),
    });

    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.MEMBERS);
    return { success: true, data: { invitationId: invitation.id } };
  } catch (error) {
    return toActionError(error, {
      fallback: "invalidInput",
      baFallback: "inviteMember",
    });
  }
}

/**
 * Remove multiple members from the organization
 */
export async function removeMembersAction(
  input: RemoveMembersInput
): Promise<ActionResult<{ removedCount: number }>> {
  try {
    const validated = removeMembersSchema.parse(input);

    const caller = await checkOrgPermission(validated.organizationId, {
      member: ["delete"],
    });
    if (!caller) {
      return actionError("unauthorized");
    }

    // Get members to remove and validate
    const membersToRemove = await database.member.findMany({
      where: {
        id: { in: validated.memberIds },
        organizationId: validated.organizationId,
      },
      select: { id: true, role: true, userId: true },
    });

    // Filter out owners and self
    const validMembers = membersToRemove.filter(
      (m) => m.role !== ORG_ROLES.OWNER && m.userId !== caller.userId
    );

    if (validMembers.length === 0) {
      return actionError("noValidMembers");
    }

    // Remove members and revoke their org-scoped sessions atomically
    // so a partial failure can't leave removed members with active sessions
    const [memberResult] = await database.$transaction([
      database.member.deleteMany({
        where: {
          id: { in: validMembers.map((m) => m.id) },
        },
      }),
      database.session.deleteMany({
        where: {
          userId: { in: validMembers.map((m) => m.userId) },
          activeOrganizationId: validated.organizationId,
        },
      }),
    ]);

    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.MEMBERS);
    return { success: true, data: { removedCount: memberResult.count } };
  } catch (error) {
    return toActionError(error, { fallback: "removeMember" });
  }
}

/**
 * Update a member's role
 */
export async function updateMemberRoleAction(
  input: UpdateRoleInput
): Promise<ActionResult> {
  try {
    const validated = updateRoleSchema.parse(input);

    const caller = await checkOrgPermission(validated.organizationId, {
      member: ["update"],
    });
    if (!caller) {
      return actionError("unauthorized");
    }

    // Atomic update with constraints to prevent TOCTOU race conditions.
    // Uses updateMany so all guards (not owner, not self) are enforced atomically.
    const result = await database.member.updateMany({
      where: {
        id: validated.memberId,
        organizationId: validated.organizationId,
        role: { not: ORG_ROLES.OWNER },
        userId: { not: caller.userId },
      },
      data: { role: validated.newRole },
    });

    if (result.count === 0) {
      const errorCode = await diagnoseMemberUpdateFailure(
        validated.memberId,
        validated.organizationId,
        caller.userId,
        "role change"
      );
      return actionError(errorCode);
    }

    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.MEMBERS);
    return { success: true };
  } catch (error) {
    return toActionError(error, { fallback: "updateRole" });
  }
}

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

    const caller = await checkOrgPermission(validated.organizationId, {
      invitation: ["create"],
    });
    if (!caller) {
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

    const caller = await checkOrgPermission(validated.organizationId, {
      invitation: ["cancel"],
    });
    if (!caller) {
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

    const caller = await checkOrgPermission(validated.organizationId, {
      invitation: ["cancel"],
    });
    if (!caller) {
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

/**
 * Revoke multiple active invite links
 */
export async function revokeInviteLinksAction(
  input: RevokeInviteLinksInput
): Promise<ActionResult<{ revokedCount: number }>> {
  try {
    const validated = revokeInviteLinksSchema.parse(input);

    const caller = await checkOrgPermission(validated.organizationId, {
      invitation: ["cancel"],
    });
    if (!caller) {
      return actionError("unauthorized");
    }

    const result = await database.inviteLink.updateMany({
      where: {
        id: { in: validated.inviteLinkIds },
        organizationId: validated.organizationId,
        isActive: true,
      },
      data: { isActive: false },
    });

    if (result.count === 0) {
      return actionError("noActiveInviteLinks");
    }

    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.MEMBERS);
    return { success: true, data: { revokedCount: result.count } };
  } catch (error) {
    return toActionError(error, { fallback: "revokeInviteLinks" });
  }
}

/**
 * Process invitation for one email in bulk invite via BA API
 *
 * RETURNS: null if success, error message if failed (for tracking failures)
 */
async function processBulkInviteEmail(
  email: string,
  organizationId: string,
  role: BulkInviteInput["role"],
  reqHeaders: Headers
): Promise<string | null> {
  try {
    await auth.api.createInvitation({
      body: { email, role, organizationId },
      headers: reqHeaders,
    });
    return null; // Success
  } catch (error) {
    const message = await mapBAError(error, "unknownError");
    return `${email} (failed - ${message})`;
  }
}

/**
 * Throw if valid email count exceeds remaining plan capacity.
 * -1 means unlimited (no check needed).
 */
function enforceCapacity(validCount: number, remaining: number): void {
  if (remaining !== -1 && validCount > remaining) {
    throw new Error(
      `Cannot invite ${validCount} members. Only ${remaining} seat(s) remaining on your plan. Remove some emails and try again.`
    );
  }
}

/**
 * Process batch of emails for bulk invitation
 * Uses batch pre-check for performance, then delegates each invite to BA API
 */
async function processBulkInviteEmails(
  emails: string[],
  organizationId: string,
  role: BulkInviteInput["role"],
  opts: { reqHeaders: Headers; remainingCapacity: number }
): Promise<{ invited: number; skipped: string[] }> {
  const { reqHeaders, remainingCapacity } = opts;
  const skipReasons = await checkBulkInviteSkip(emails, organizationId);
  const skipped: string[] = [];
  let invited = 0;

  // Separate skipped emails from valid ones
  const validEmails: string[] = [];
  for (const email of emails) {
    const skipReason = skipReasons.get(email);
    if (skipReason) {
      skipped.push(skipReason);
    } else {
      validEmails.push(email);
    }
  }

  enforceCapacity(validEmails.length, remainingCapacity);

  // Process valid emails in parallel batches for performance
  for (let i = 0; i < validEmails.length; i += BULK_INVITE_CONCURRENCY) {
    const batch = validEmails.slice(i, i + BULK_INVITE_CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((email) =>
        processBulkInviteEmail(email, organizationId, role, reqHeaders)
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        skipped.push(result.value);
      } else if (result.status === "fulfilled") {
        invited++;
      } else {
        skipped.push("unknown email (unexpected error)");
      }
    }
  }

  return { invited, skipped };
}

async function checkBulkInviteSkip(
  emails: string[],
  organizationId: string
): Promise<Map<string, string>> {
  const skipReasons = new Map<string, string>();

  // BATCH QUERY 1: Fetch all users by email list (single query, not N queries)
  const existingUsers = await database.user.findMany({
    where: {
      email: { in: emails },
    },
    select: { id: true, email: true },
  });

  const usersByEmail = new Map(existingUsers.map((u) => [u.email, u.id]));

  // BATCH QUERY 2: Fetch all members for these users in this org (single query)
  if (existingUsers.length > 0) {
    const existingMembers = await database.member.findMany({
      where: {
        userId: { in: existingUsers.map((u) => u.id) },
        organizationId,
      },
      select: { userId: true },
    });

    const memberUserIds = new Set(existingMembers.map((m) => m.userId));

    // Mark emails of existing members to skip
    for (const [email, userId] of usersByEmail) {
      if (memberUserIds.has(userId)) {
        skipReasons.set(email, `${email} (already a member)`);
      }
    }
  }

  // BATCH QUERY 3: Fetch all pending invitations for these emails in this org (single query)
  const existingInvitations = await database.invitation.findMany({
    where: {
      email: { in: emails },
      organizationId,
      status: INVITATION_STATUS.PENDING,
    },
    select: { email: true },
  });

  const invitedEmails = new Set(
    existingInvitations.map((inv) => inv.email.toLowerCase())
  );

  // Mark invited emails to skip
  for (const email of emails) {
    if (!skipReasons.has(email) && invitedEmails.has(email.toLowerCase())) {
      skipReasons.set(email, `${email} (already invited)`);
    }
  }

  return skipReasons;
}

/**
 * Bulk invite multiple members
 *
 * Uses batch pre-check for performance (3 queries vs N failed BA calls),
 * then delegates each valid invite to BA's inviteMember API.
 */
export async function bulkInviteAction(
  input: BulkInviteInput
): Promise<ActionResult<{ invited: number; skipped: string[] }>> {
  try {
    const validated = bulkInviteSchema.parse(input);

    const caller = await checkOrgPermission(validated.organizationId, {
      invitation: ["create"],
    });
    if (!caller) {
      return actionError("unauthorized");
    }

    //
    auth.api.hasPermission("");

    const memberCheck = await canOrgAddMember(validated.organizationId);
    if (!memberCheck.allowed) {
      return actionError("memberLimitReached");
    }

    const reqHeaders = await headers();

    const { invited, skipped } = await processBulkInviteEmails(
      validated.emails,
      validated.organizationId,
      validated.role,
      { reqHeaders, remainingCapacity: memberCheck.remaining }
    );

    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.MEMBERS);
    return { success: true, data: { invited, skipped } };
  } catch (error) {
    if (error instanceof Error && error.message.includes("seat(s) remaining")) {
      return actionError("seatLimitReached");
    }
    return toActionError(error, {
      fallback: "invalidInput",
      baFallback: "bulkInvite",
    });
  }
}

/**
 * Suspend a member
 */
export async function suspendMemberAction(
  input: SuspendMemberInput
): Promise<ActionResult> {
  try {
    const validated = suspendMemberSchema.parse(input);

    const caller = await checkOrgPermission(validated.organizationId, {
      member: ["update"],
    });
    if (!caller) {
      return actionError("unauthorized");
    }

    // Atomic update with constraints to prevent TOCTOU race conditions.
    // Uses updateMany so all guards (not owner, not self, not already suspended) are enforced atomically.
    const result = await database.member.updateMany({
      where: {
        id: validated.memberId,
        organizationId: validated.organizationId,
        role: { not: ORG_ROLES.OWNER },
        userId: { not: caller.userId },
        suspendedAt: null,
      },
      data: {
        suspendedAt: new Date(),
        suspendedBy: caller.userId,
        suspendReason: validated.reason || null,
      },
    });

    if (result.count === 0) {
      const errorCode = await diagnoseMemberUpdateFailure(
        validated.memberId,
        validated.organizationId,
        caller.userId,
        "suspension"
      );
      return actionError(errorCode);
    }

    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.MEMBERS);
    return { success: true };
  } catch (error) {
    return toActionError(error, { fallback: "suspendMember" });
  }
}

/**
 * Reactivate a suspended member
 */
export async function reactivateMemberAction(
  input: ReactivateMemberInput
): Promise<ActionResult> {
  try {
    const validated = reactivateMemberSchema.parse(input);

    const caller = await checkOrgPermission(validated.organizationId, {
      member: ["update"],
    });
    if (!caller) {
      return actionError("unauthorized");
    }

    const targetMember = await database.member.findFirst({
      where: {
        id: validated.memberId,
        organizationId: validated.organizationId,
        suspendedAt: { not: null },
      },
    });

    if (!targetMember) {
      return actionError("suspendedMemberNotFound");
    }

    await database.member.update({
      where: { id: validated.memberId },
      data: {
        suspendedAt: null,
        suspendedBy: null,
        suspendReason: null,
      },
    });

    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.MEMBERS);
    return { success: true };
  } catch (error) {
    return toActionError(error, { fallback: "reactivateMember" });
  }
}

/**
 * Create a shareable invite link
 */
export async function createInviteLinkAction(
  input: CreateInviteLinkInput
): Promise<ActionResult<{ token: string; url: string }>> {
  try {
    const validated = createInviteLinkSchema.parse(input);

    const caller = await checkOrgPermission(validated.organizationId, {
      invitation: ["create"],
    });
    if (!caller) {
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
        createdById: caller.userId,
      },
    });

    const url = `${env.BETTER_AUTH_URL}/invite/${token}`;

    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.MEMBERS);
    return { success: true, data: { token, url } };
  } catch (error) {
    return toActionError(error, { fallback: "createInviteLink" });
  }
}

/**
 * Revoke an invite link
 */
export async function revokeInviteLinkAction(
  input: InviteLinkIdInput
): Promise<ActionResult> {
  try {
    const validated = inviteLinkIdSchema.parse(input);

    const caller = await checkOrgPermission(validated.organizationId, {
      invitation: ["cancel"],
    });
    if (!caller) {
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

    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.MEMBERS);
    return { success: true };
  } catch (error) {
    return toActionError(error, { fallback: "revokeInviteLink" });
  }
}

/**
 * Transfer organization ownership
 */
export async function transferOwnershipAction(
  input: TransferOwnershipInput
): Promise<ActionResult> {
  try {
    const validated = transferOwnershipSchema.parse(input);

    const { session, error } = await verifySession();
    if (error) {
      return error;
    }

    // Pre-check: validate new owner exists and is eligible (read-only, guarded by transaction)
    const newOwner = await database.member.findFirst({
      where: {
        id: validated.newOwnerMemberId,
        organizationId: validated.organizationId,
      },
      select: { id: true, role: true, userId: true, suspendedAt: true },
    });

    if (!newOwner) {
      return actionError("memberNotFound");
    }

    if (newOwner.suspendedAt) {
      return actionError("cannotTransferToSuspended");
    }

    if (newOwner.userId === session.user.id) {
      return actionError("alreadyOwner");
    }

    // Transfer ownership in an interactive transaction to prevent race conditions
    await database.$transaction(async (tx) => {
      // Verify caller is the current owner inside transaction to prevent TOCTOU race
      const currentOwner = await tx.member.findFirst({
        where: {
          userId: session.user.id,
          organizationId: validated.organizationId,
          role: ORG_ROLES.OWNER,
        },
      });

      if (!currentOwner) {
        throw new Error("Only the owner can transfer ownership");
      }

      // Demote current owner to admin
      await tx.member.update({
        where: { id: currentOwner.id },
        data: { role: ORG_ROLES.ADMIN },
      });
      // Promote new owner
      await tx.member.update({
        where: { id: newOwner.id },
        data: { role: ORG_ROLES.OWNER },
      });
    });

    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.MEMBERS);
    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.SETTINGS);
    return { success: true };
  } catch (error) {
    return toActionError(error, { fallback: "transferOwnership" });
  }
}
