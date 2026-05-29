import { database } from "@repo/database";
import { ORG_ROLES } from "./permissions";

/**
 * Subscription action strings emitted by @better-auth/stripe's
 * `authorizeReference` callback. Kept here (rather than imported from BA's
 * private types) so we can lock the contract explicitly and surface unknown
 * actions in logs if BA adds new ones in a future version.
 */
export type SubscriptionAction =
  | "list-subscription"
  | "upgrade-subscription"
  | "cancel-subscription"
  | "restore-subscription"
  | "billing-portal";

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
 * - Unknown actions are denied and logged so an upstream BA Stripe plugin
 *   version bump that adds new actions doesn't silently lock users out.
 */
export async function authorizeBillingAction({
  userId,
  referenceId,
  action,
}: {
  userId: string;
  referenceId: string;
  action: string;
}): Promise<boolean> {
  if (action === "list-subscription") {
    return isOrgMember(userId, referenceId);
  }
  if (
    action === "upgrade-subscription" ||
    action === "cancel-subscription" ||
    action === "restore-subscription" ||
    action === "billing-portal"
  ) {
    return canManageBilling(userId, referenceId);
  }
  console.warn(`[auth] Unknown subscription action denied: ${action}`);
  return false;
}
