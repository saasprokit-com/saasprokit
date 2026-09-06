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

const PLACEHOLDER_BASE = 4;
const PLACEHOLDER_SPREAD = 18;
const PLACEHOLDER_WEEKEND_WEIGHT = 0.3;
const PLACEHOLDER_SEED = 7;
const PLACEHOLDER_PRIME = 31;
const PLACEHOLDER_MODULUS = 9973;
const PLACEHOLDER_MIX = 7919;
const SUNDAY = 0;
const SATURDAY = 6;

function placeholderCount(day: string): number {
  const weekday = new Date(`${day}T00:00:00.000Z`).getUTCDay();
  const isWeekend = weekday === SUNDAY || weekday === SATURDAY;
  const rolled = Array.from(day).reduce(
    (acc, char) =>
      (acc * PLACEHOLDER_PRIME + char.charCodeAt(0)) % PLACEHOLDER_MODULUS,
    PLACEHOLDER_SEED
  );
  const seed = (rolled * rolled + PLACEHOLDER_MIX) % PLACEHOLDER_MODULUS;

  return Math.round(
    (PLACEHOLDER_BASE + (seed % PLACEHOLDER_SPREAD)) *
      (isWeekend ? PLACEHOLDER_WEEKEND_WEIGHT : 1)
  );
}

export function getOrgActivityPlaceholder(
  range: DashboardRange
): Promise<DailyCount[]> {
  const { since, days } = resolveRange(range);

  return Promise.resolve(
    zeroFill([], since, days).map(({ day }) => ({
      count: placeholderCount(day),
      day,
    }))
  );
}
