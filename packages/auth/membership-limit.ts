import { database } from "@repo/database";
import { ACTIVE_STATUSES, UNLIMITED } from "@repo/utils/payment";
import { getCurrentPlan } from "./helpers";
import { getPlanLimits } from "./plans";

export async function getOrganizationMembershipLimit(
  organizationId: string
): Promise<number> {
  const subscription = await database.subscription.findFirst({
    where: {
      referenceId: organizationId,
      status: { in: [...ACTIVE_STATUSES] },
    },
    orderBy: { createdAt: "desc" },
  });
  const { maxMembers } = getPlanLimits(getCurrentPlan(subscription));
  return maxMembers === UNLIMITED ? Number.MAX_SAFE_INTEGER : maxMembers;
}
