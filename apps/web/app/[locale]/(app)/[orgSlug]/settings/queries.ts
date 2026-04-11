import "server-only";

import { database, type Prisma } from "@repo/database";

const orgSettingsSelect = {
  id: true,
  name: true,
  slug: true,
  logo: true,
  createdAt: true,
} satisfies Prisma.OrganizationSelect;

export type OrgSettingsData = Prisma.OrganizationGetPayload<{
  select: typeof orgSettingsSelect;
}>;

export function getOrgSettingsData(organizationId: string) {
  return database.organization.findUnique({
    where: { id: organizationId },
    select: orgSettingsSelect,
  });
}
