import "server-only";

import { database } from "@repo/database";
import { SECONDS_PER_DAY } from "@repo/utils/date";
import { ACTIVE_STATUSES } from "@repo/utils/payment";

export interface AdminKpis {
  bannedUsers: number | null;
  newUsers30d: number | null;
  subscriptionsByPlan: { plan: string; count: number }[];
  totalOrgs: number;
  /** null when includeUserStats is false (moderators cannot list users). */
  totalUsers: number | null;
}

const THIRTY_DAYS_MS = 30 * SECONDS_PER_DAY * 1000;

/**
 * Platform KPIs for the /admin dashboard. User stats are gated: moderators lack
 * `user: ["list"]`, so their caller passes includeUserStats=false and never triggers
 * (or sees) the user counts.
 */
export async function getAdminKpis(opts: {
  includeUserStats: boolean;
}): Promise<AdminKpis> {
  const since = new Date(Date.now() - THIRTY_DAYS_MS);

  const [totalOrgs, subscriptionGroups, userStats] = await Promise.all([
    database.organization.count(),
    database.subscription.groupBy({
      by: ["plan"],
      where: { status: { in: [...ACTIVE_STATUSES] } },
      _count: true,
    }),
    opts.includeUserStats
      ? Promise.all([
          database.user.count(),
          database.user.count({ where: { createdAt: { gte: since } } }),
          database.user.count({ where: { banned: true } }),
        ])
      : Promise.resolve(null),
  ]);

  return {
    totalUsers: userStats ? userStats[0] : null,
    newUsers30d: userStats ? userStats[1] : null,
    bannedUsers: userStats ? userStats[2] : null,
    totalOrgs,
    subscriptionsByPlan: subscriptionGroups.map((group) => ({
      plan: group.plan,
      count: group._count,
    })),
  };
}
