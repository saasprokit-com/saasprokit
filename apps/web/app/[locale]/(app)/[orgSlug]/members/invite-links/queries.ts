import "server-only";

import type { OrgRoleName } from "@repo/auth/permissions";
import { database, type Prisma } from "@repo/database";
import { INVITE_LINK_STATUS } from "@repo/utils/organization";
import type { InviteLinksSearchParams } from "./validations";

const inviteLinkSelect = {
  id: true,
  token: true,
  role: true,
  expiresAt: true,
  maxUses: true,
  usedCount: true,
  createdAt: true,
  isActive: true,
  createdBy: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.InviteLinkSelect;

type GetInviteLinksInput = InviteLinksSearchParams & {
  organizationId: string;
};

export async function getInviteLinks({
  organizationId,
  page,
  perPage,
  sort,
  search,
  role,
  status,
}: GetInviteLinksInput) {
  const skip = (page - 1) * perPage;
  const take = perPage;

  const where: Prisma.InviteLinkWhereInput = {
    organizationId,
  };

  // Search filter (token prefix, case-insensitive)
  if (search) {
    where.token = { contains: search, mode: "insensitive" };
  }

  // Role filter
  if (role.length > 0) {
    where.role = { in: role };
  }

  // Status filter (active / revoked)
  if (status.length > 0) {
    if (
      status.includes(INVITE_LINK_STATUS.ACTIVE) &&
      !status.includes(INVITE_LINK_STATUS.REVOKED)
    ) {
      where.isActive = true;
    } else if (
      status.includes(INVITE_LINK_STATUS.REVOKED) &&
      !status.includes(INVITE_LINK_STATUS.ACTIVE)
    ) {
      where.isActive = false;
    }
    // If both are selected, no filter needed
  }

  const orderBy = buildOrderBy(sort);

  const [inviteLinks, totalCount] = await Promise.all([
    database.inviteLink.findMany({
      where,
      select: inviteLinkSelect,
      skip,
      take,
      orderBy,
    }),
    database.inviteLink.count({ where }),
  ]);

  const pageCount = Math.ceil(totalCount / perPage);

  return {
    inviteLinks: inviteLinks.map((link) => ({
      ...link,
      role: link.role as OrgRoleName,
    })),
    totalCount,
    pageCount,
  };
}

function buildOrderBy(
  sort: InviteLinksSearchParams["sort"]
):
  | Prisma.InviteLinkOrderByWithRelationInput
  | Prisma.InviteLinkOrderByWithRelationInput[] {
  if (sort.length === 0) {
    return { createdAt: "desc" };
  }

  return sort.map((s) => {
    const direction = s.desc ? "desc" : "asc";

    switch (s.id) {
      case "role":
        return { role: direction } as Prisma.InviteLinkOrderByWithRelationInput;
      case "usedCount":
        return {
          usedCount: direction,
        } as Prisma.InviteLinkOrderByWithRelationInput;
      case "createdAt":
        return {
          createdAt: direction,
        } as Prisma.InviteLinkOrderByWithRelationInput;
      case "isActive":
        return {
          isActive: direction,
        } as Prisma.InviteLinkOrderByWithRelationInput;
      default:
        return {
          createdAt: "desc",
        } as Prisma.InviteLinkOrderByWithRelationInput;
    }
  });
}
