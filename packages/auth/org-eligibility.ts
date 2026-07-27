import { database } from "@repo/database";
import {
  ACTIVE_STATUSES,
  checkOrgCreationEligibility,
  PLAN_NAMES,
} from "@repo/utils/payment";
import { ORG_ROLES } from "./permissions";

export async function canUserCreateOrg(
  userId: string,
  maxOrgsPerUser: number
): Promise<boolean> {
  const memberships = await database.member.findMany({
    where: { userId, role: ORG_ROLES.OWNER },
    select: { organizationId: true },
  });

  const orgIds = memberships.map((m) => m.organizationId);
  const orgSubs = await database.subscription.findMany({
    where: {
      referenceId: { in: orgIds },
      status: { in: [...ACTIVE_STATUSES] },
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
    maxOrgsPerUser
  ).allowed;
}
