import type { AuthorizeReferenceAction } from "@better-auth/stripe";
import { database } from "@repo/database";
import { ORG_ROLES } from "./permissions";

/**
 * Check if a user is an active (non-suspended) member of an organization.
 * Used for read-only subscription access (list-subscription).
 */
export async function isOrgMember(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const member = await database.member.findFirst({
    where: { userId, organizationId, suspendedAt: null },
    select: { id: true },
  });
  return member !== null;
}

/**
 * Check if a user can manage billing for an organization.
 * Only active (non-suspended) org owners and admins are allowed.
 */
export async function canManageBilling(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const member = await database.member.findFirst({
    where: { userId, organizationId, suspendedAt: null },
    select: { role: true },
  });
  if (!member) {
    return false;
  }
  return member.role === ORG_ROLES.OWNER || member.role === ORG_ROLES.ADMIN;
}

/**
 * Authorize a Better Auth Stripe subscription action against an organization.
 *
 * - `list-subscription` (read) is allowed for any active member.
 * - All other actions (mutations + portal) require an active owner or admin.
 *
 * The exhaustive `switch` is type-checked against `AuthorizeReferenceAction`,
 * so a future BA Stripe plugin release that adds a new action will cause a
 * TypeScript error in the `default` branch and force the codebase to decide
 * which role can use it before shipping. The runtime `console.warn` is a
 * belt-and-braces safety net for the case where types drift from runtime
 * (e.g. mixed versions in a pnpm hoist).
 */
export async function authorizeBillingAction({
  userId,
  referenceId,
  action,
}: {
  userId: string;
  referenceId: string;
  action: AuthorizeReferenceAction;
}): Promise<boolean> {
  switch (action) {
    case "list-subscription":
      return await isOrgMember(userId, referenceId);
    case "upgrade-subscription":
    case "cancel-subscription":
    case "restore-subscription":
    case "billing-portal":
      return await canManageBilling(userId, referenceId);
    default: {
      const _exhaustive: never = action;
      console.warn(
        `[auth] Unknown subscription action denied: ${String(_exhaustive)}`
      );
      return false;
    }
  }
}
