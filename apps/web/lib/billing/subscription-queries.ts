/**
 * Server-only subscription and usage queries.
 *
 * These functions query the database for subscription/member/invitation/file
 * data and delegate pure business-logic checks to @repo/payment helpers.
 */

import "server-only";

import { ORG_ROLES } from "@repo/auth/permissions";
import { database } from "@repo/database";
import { calculateUsageStats } from "@repo/payment/helpers";
import { getPlanLimits } from "@repo/payment/plans";
import type { Subscription } from "@repo/payment/types";
import { SubscriptionSchema } from "@repo/payment/types";
import { INVITATION_STATUS } from "@repo/utils/organization";
import {
  ACTIVE_STATUSES,
  checkOrgCreationEligibility,
  type OrgCreationCheck,
  PLAN_NAMES,
  type PlanName,
} from "@repo/utils/payment";
import { ATTACHABLE_TYPE, BYTES_PER_MB } from "@repo/utils/storage";
import { env } from "@/lib/env";

/**
 * Get subscription for an organization by org ID
 */
export async function getOrgSubscription(
  organizationId: string
): Promise<Subscription | null> {
  const subscription = await database.subscription.findFirst({
    where: { referenceId: organizationId },
    orderBy: { id: "desc" },
  });

  if (!subscription) {
    return null;
  }

  const validationResult = SubscriptionSchema.safeParse(subscription);
  if (!validationResult.success) {
    throw new Error(
      `Invalid subscription data for organization ${organizationId}`
    );
  }

  return validationResult.data as Subscription;
}

/**
 * Get active subscription for a reference (user or org)
 */
export async function getActiveSubscription(
  referenceId: string
): Promise<Subscription | null> {
  const subscription = await database.subscription.findFirst({
    where: {
      referenceId,
      status: { in: ACTIVE_STATUSES as unknown as string[] },
    },
    orderBy: { id: "desc" },
  });

  return subscription as Subscription | null;
}

/**
 * Get the current plan for a reference
 */
export async function getCurrentPlanForReference(
  referenceId: string
): Promise<PlanName> {
  const subscription = await getActiveSubscription(referenceId);
  if (!subscription) {
    return PLAN_NAMES.FREE;
  }
  return (subscription.plan as PlanName) || PLAN_NAMES.FREE;
}

/**
 * Get organization member count
 */
export function getOrgMemberCount(organizationId: string): Promise<number> {
  return database.member.count({ where: { organizationId } });
}

/**
 * Get organization storage usage in MB.
 */
export async function getOrgStorageUsage(
  organizationId: string
): Promise<number> {
  const result = await database.file.aggregate({
    where: {
      attachableType: ATTACHABLE_TYPE.ORGANIZATION,
      attachableId: organizationId,
      deletedAt: null,
    },
    _sum: { size: true },
  });

  const bytes = result._sum.size || 0;
  return Math.round(bytes / BYTES_PER_MB);
}

/**
 * Get count of pending invitations for an organization.
 * Pending invitations reserve seats toward the member limit.
 */
function getOrgPendingInvitationCount(organizationId: string): Promise<number> {
  return database.invitation.count({
    where: { organizationId, status: INVITATION_STATUS.PENDING },
  });
}

/**
 * Get complete usage stats for an organization.
 * Fetches DB data, then delegates percentage/limit math to pure helper.
 */
export async function getOrgUsageStats(organizationId: string) {
  const [subscription, memberCount, pendingCount, storageMB] =
    await Promise.all([
      getOrgSubscription(organizationId),
      getOrgMemberCount(organizationId),
      getOrgPendingInvitationCount(organizationId),
      getOrgStorageUsage(organizationId),
    ]);

  const occupiedSeats = memberCount + pendingCount;

  return calculateUsageStats(subscription, occupiedSeats, storageMB);
}

/**
 * Check if organization can add more members.
 * Counts both current members (including suspended) and pending invitations
 * toward the plan limit, since both represent reserved seats.
 */
export async function canOrgAddMember(
  organizationId: string
): Promise<{ allowed: boolean; reason?: string; remaining: number }> {
  const [subscription, memberCount, pendingCount] = await Promise.all([
    getOrgSubscription(organizationId),
    getOrgMemberCount(organizationId),
    getOrgPendingInvitationCount(organizationId),
  ]);

  const planName = (subscription?.plan as PlanName) || PLAN_NAMES.FREE;
  const limits = getPlanLimits(planName);

  if (limits.maxMembers === -1) {
    return { allowed: true, remaining: -1 };
  }

  const occupiedSeats = memberCount + pendingCount;
  const remaining = Math.max(0, limits.maxMembers - occupiedSeats);

  if (remaining === 0) {
    return {
      allowed: false,
      reason: `You have reached the maximum of ${limits.maxMembers} members on your ${planName} plan`,
      remaining: 0,
    };
  }

  return { allowed: true, remaining };
}

/**
 * Check if user can create more organizations.
 *
 * Rules:
 * 1. Every user gets 1 free organization (no payment required)
 * 2. To create additional orgs, all existing orgs must have paid subscriptions
 * 3. Hard cap of MAX_ORGS_PER_USER organizations per user
 */
export async function canUserCreateOrg(
  userId: string
): Promise<OrgCreationCheck> {
  const memberships = await database.member.findMany({
    where: { userId, role: ORG_ROLES.OWNER },
    select: { organizationId: true },
  });

  const orgIds = memberships.map((m) => m.organizationId);
  const orgSubs = await database.subscription.findMany({
    where: {
      referenceId: { in: orgIds },
      status: { in: ACTIVE_STATUSES as unknown as string[] },
    },
  });

  let freePlanCount = 0;
  for (const sub of orgSubs) {
    if (sub.plan === PLAN_NAMES.FREE) {
      freePlanCount++;
    }
  }

  return checkOrgCreationEligibility(
    memberships.length,
    freePlanCount,
    env.MAX_ORGS_PER_USER
  );
}
