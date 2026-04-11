import "server-only";

import { database, type Prisma } from "@repo/database";

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
