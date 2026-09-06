import "server-only";

import { calculateUsageStats, getCurrentPlan } from "@repo/auth/helpers";
import { ORG_ROLES } from "@repo/auth/permissions";
import { database, type Subscription } from "@repo/database";
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
  return bytes / BYTES_PER_MB;
}

export async function getOrgUsageStats(organizationId: string) {
  const [subscription, memberCount, storageMB] = await Promise.all([
    getActiveSubscription(organizationId),
    getOrgMemberCount(organizationId),
    getOrgStorageUsage(organizationId),
  ]);

  return calculateUsageStats(subscription, memberCount, storageMB);
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
