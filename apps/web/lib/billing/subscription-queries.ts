import "server-only";

import { calculateUsageStats, getCurrentPlan } from "@repo/auth/helpers";
import { ORG_ROLES } from "@repo/auth/permissions";
import { getPlanLimits } from "@repo/auth/plans";
import { database, type Subscription } from "@repo/database";
import { INVITATION_STATUS } from "@repo/utils/organization";
import {
  ACTIVE_STATUSES,
  checkOrgCreationEligibility,
  type OrgCreationCheck,
  PLAN_NAMES,
  type PlanName,
} from "@repo/utils/payment";
import { ATTACHABLE_TYPE, BYTES_PER_MB } from "@repo/utils/storage";
import { cache } from "react";
import { env } from "@/lib/env";

export const getActiveSubscription = cache(
  (organizationId: string): Promise<Subscription | null> =>
    database.subscription.findFirst({
      where: {
        referenceId: organizationId,
        status: { in: ACTIVE_STATUSES as unknown as string[] },
      },
      orderBy: { id: "desc" },
    })
);

export async function getCurrentPlanForOrg(
  organizationId: string
): Promise<PlanName> {
  return getCurrentPlan(await getActiveSubscription(organizationId));
}

export function getOrgMemberCount(organizationId: string): Promise<number> {
  return database.member.count({ where: { organizationId } });
}

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

function getOrgPendingInvitationCount(organizationId: string): Promise<number> {
  return database.invitation.count({
    where: { organizationId, status: INVITATION_STATUS.PENDING },
  });
}

export async function getOrgUsageStats(organizationId: string) {
  const [subscription, memberCount, pendingCount, storageMB] =
    await Promise.all([
      getActiveSubscription(organizationId),
      getOrgMemberCount(organizationId),
      getOrgPendingInvitationCount(organizationId),
      getOrgStorageUsage(organizationId),
    ]);

  const occupiedSeats = memberCount + pendingCount;

  return calculateUsageStats(subscription, occupiedSeats, storageMB);
}

export async function canOrgAddMember(
  organizationId: string
): Promise<{ allowed: boolean; reason?: string; remaining: number }> {
  const [subscription, memberCount, pendingCount] = await Promise.all([
    getActiveSubscription(organizationId),
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
