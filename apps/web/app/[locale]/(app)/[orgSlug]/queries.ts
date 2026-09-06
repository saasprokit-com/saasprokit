import "server-only";

import { database, type Prisma } from "@repo/database";
import {
  type DailyCount,
  resolveRange,
  zeroFill,
} from "@/lib/analytics/buckets";
import type { DashboardRange } from "@/lib/parsers";

const orgDashboardSelect = {
  name: true,
  slug: true,
  createdAt: true,
} satisfies Prisma.OrganizationSelect;

export type OrgDashboardData = Prisma.OrganizationGetPayload<{
  select: typeof orgDashboardSelect;
}>;

export async function getOrgDashboardData(organizationId: string) {
  const [memberCount, organization] = await Promise.all([
    database.member.count({
      where: { organizationId },
    }),
    database.organization.findUnique({
      where: { id: organizationId },
      select: orgDashboardSelect,
    }),
  ]);

  return { memberCount, organization };
}

interface OrgChartArgs {
  organizationId: string;
  range: DashboardRange;
}

export async function getOrgMemberGrowth({
  organizationId,
  range,
}: OrgChartArgs): Promise<DailyCount[]> {
  const { since, days } = resolveRange(range);

  const [baseline, rows] = await Promise.all([
    database.member.count({
      where: { organizationId, createdAt: { lt: since } },
    }),
    database.$queryRaw<DailyCount[]>`
      SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
             count(*)::int AS count
      FROM "member"
      WHERE "organizationId" = ${organizationId}
        AND "createdAt" >= ${since}
      GROUP BY day
      ORDER BY day
    `,
  ]);

  let running = baseline;

  return zeroFill(rows, since, days).map((row) => {
    running += row.count;

    return { count: running, day: row.day };
  });
}

export async function getOrgActivity({
  organizationId,
  range,
}: OrgChartArgs): Promise<DailyCount[]> {
  const { since, days } = resolveRange(range);

  const rows = await database.$queryRaw<DailyCount[]>`
    SELECT to_char(date_trunc('day', a."createdAt"), 'YYYY-MM-DD') AS day,
           count(*)::int AS count
    FROM "audit_log" a
    WHERE a."createdAt" >= ${since}
      AND EXISTS (
        SELECT 1 FROM "member" m
        WHERE m."userId" = a."userId"
          AND m."organizationId" = ${organizationId}
      )
    GROUP BY day
    ORDER BY day
  `;

  return zeroFill(rows, since, days);
}
