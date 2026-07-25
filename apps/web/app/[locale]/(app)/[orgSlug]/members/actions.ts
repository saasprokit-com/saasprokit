"use server";

import { ORG_ROLES } from "@repo/auth/permissions";
import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import {
  BULK_INVITE_CONCURRENCY,
  INVITATION_STATUS,
} from "@repo/utils/organization";
import { parseEmailInput } from "@repo/utils/user";
import { headers } from "next/headers";
import { verifySession } from "@/lib/auth/action-auth";
import { actionError, toActionError } from "@/lib/auth/action-error";
import {
  type ActionResult,
  getServerSession,
  hasOrgPermission,
} from "@/lib/auth/auth";
import { canOrgAddMember } from "@/lib/billing/subscription-queries";
import { type FormState, fieldErrorsFrom } from "@/lib/forms";
import { revalidateOrgPage } from "@/lib/infrastructure/revalidation";
import { ORG_PAGES } from "@/lib/routes";
import {
  type BulkInviteActionInput,
  type BulkInviteInput,
  bulkInviteActionSchema,
  bulkInviteSchema,
  type InviteMemberInput,
  inviteMemberSchema,
  type RemoveMembersInput,
  removeMembersSchema,
  type TransferOwnershipInput,
  transferOwnershipSchema,
  type UpdateRoleInput,
  updateRoleSchema,
  validateEmails,
} from "./schemas";

export type InviteMemberFormState = FormState<InviteMemberInput>;

export async function inviteMemberAction(
  _prevState: InviteMemberFormState,
  input: InviteMemberInput
): Promise<InviteMemberFormState> {
  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    const validated = parsed.data;

    const memberCheck = await canOrgAddMember(validated.organizationId);
    if (!memberCheck.allowed) {
      return actionError("memberLimitReached");
    }

    await auth.api.createInvitation({
      body: {
        email: validated.email,
        role: validated.role,
        organizationId: validated.organizationId,
      },
      headers: await headers(),
    });

    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.MEMBERS);
    return { status: "success" };
  } catch (error) {
    return toActionError(error, {
      fallback: "invalidInput",
    });
  }
}

export async function removeMembersAction(
  input: RemoveMembersInput
): Promise<ActionResult<{ removedCount: number }>> {
  try {
    const validated = removeMembersSchema.parse(input);

    const allowed = await hasOrgPermission(validated.organizationId, {
      member: ["delete"],
    });
    if (!allowed) {
      return actionError("unauthorized");
    }

    const session = await getServerSession();
    if (!session) {
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
      (m) => m.role !== ORG_ROLES.OWNER && m.userId !== session.user.id
    );

    if (validMembers.length === 0) {
      return actionError("noValidMembers");
    }

    // Deleting the membership row is enough to revoke access: every org-scoped page
    // re-reads membership on each request via getActiveOrganization(), so a removed
    // member is locked out on their very next request. Their session stays valid for
    // the organizations they still belong to.
    const memberResult = await database.member.deleteMany({
      where: {
        id: { in: validMembers.map((m) => m.id) },
      },
    });

    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.MEMBERS);
    return { success: true, data: { removedCount: memberResult.count } };
  } catch (error) {
    return toActionError(error, { fallback: "removeMember" });
  }
}

/**
 * Bound-args useActionState surface for the toolbar dialog. The typed
 * removeMembersAction stays exported for member-actions.tsx.
 */
export async function removeMembersFormAction(
  input: RemoveMembersInput,
  _prevState: ActionResult<{ removedCount: number }> | null,
  _formData: FormData
): Promise<ActionResult<{ removedCount: number }>> {
  return await removeMembersAction(input);
}

export async function updateMemberRoleAction(
  input: UpdateRoleInput
): Promise<ActionResult> {
  try {
    const validated = updateRoleSchema.parse(input);

    const allowed = await hasOrgPermission(validated.organizationId, {
      member: ["update"],
    });
    if (!allowed) {
      return actionError("unauthorized");
    }

    const session = await getServerSession();
    if (!session) {
      return actionError("unauthorized");
    }

    // Atomic update with constraints to prevent TOCTOU race conditions.
    // Uses updateMany so all guards (not owner, not self) are enforced atomically.
    const result = await database.member.updateMany({
      where: {
        id: validated.memberId,
        organizationId: validated.organizationId,
        role: { not: ORG_ROLES.OWNER },
        userId: { not: session.user.id },
      },
      data: { role: validated.newRole },
    });

    if (result.count === 0) {
      return actionError("updateRole");
    }

    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.MEMBERS);
    return { success: true };
  } catch (error) {
    return toActionError(error, { fallback: "updateRole" });
  }
}

/**
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
    const { error: message } = await toActionError(error, {
      fallback: "unknownError",
    });
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

export type BulkInviteFormState = FormState<
  BulkInviteActionInput,
  { invited: number; skipped: string[] }
>;

export async function bulkInviteAction(
  _prevState: BulkInviteFormState,
  input: BulkInviteActionInput
): Promise<BulkInviteFormState> {
  const parsedInput = bulkInviteActionSchema.safeParse(input);
  if (!parsedInput.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsedInput.error) };
  }

  // Mirror the dialog's live badge: parse the raw textarea and drop invalid
  // entries so a stray typo doesn't block the valid invites.
  const { valid } = validateEmails(parseEmailInput(parsedInput.data.emails));
  const parsed = bulkInviteSchema.safeParse({
    ...parsedInput.data,
    emails: valid,
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    const validated = parsed.data;

    // Permission (invitation:create) is enforced by BA's createInvitation itself;
    // only the plan seat cap — which BA has no concept of — is checked here.
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
    return { status: "success", data: { invited, skipped } };
  } catch (error) {
    if (error instanceof Error && error.message.includes("seat(s) remaining")) {
      return actionError("seatLimitReached");
    }
    return toActionError(error, {
      fallback: "invalidInput",
    });
  }
}

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
      select: { id: true, role: true, userId: true },
    });

    if (!newOwner) {
      return actionError("memberNotFound");
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
