import "server-only";

import type { OrgRoleName } from "@repo/auth/permissions";
import { database, type Prisma } from "@repo/database";
import { INVITATION_STATUS } from "@repo/utils/organization";
import type { MembersSearchParams } from "./validations";

/**
 * Get lightweight counts for the members layout nav badges.
 */
export async function getMembersLayoutCounts(organizationId: string) {
  const [memberCount, pendingInvitationCount, activeInviteLinkCount] =
    await Promise.all([
      database.member.count({ where: { organizationId } }),
      database.invitation.count({
        where: { organizationId, status: INVITATION_STATUS.PENDING },
      }),
      database.inviteLink.count({
        where: { organizationId, isActive: true },
      }),
    ]);

  return { memberCount, pendingInvitationCount, activeInviteLinkCount };
}

const memberSelect = {
  id: true,
  role: true,
  createdAt: true,
  userId: true,
  suspendedAt: true,
  suspendedBy: true,
  suspendReason: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      lastActiveAt: true,
    },
  },
} satisfies Prisma.MemberSelect;

type GetMembersInput = MembersSearchParams & {
  organizationId: string;
};

export async function getMembers({
  organizationId,
  page,
  perPage,
  sort,
  search,
  role,
}: GetMembersInput) {
  const skip = (page - 1) * perPage;
  const take = perPage;

  // Build where clause
  const where: Prisma.MemberWhereInput = {
    organizationId,
  };

  // Search filter (name or email, case-insensitive)
  if (search) {
    where.user = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  // Role filter
  if (role.length > 0) {
    where.role = { in: role };
  }

  // Build orderBy from sort state
  const orderBy = buildOrderBy(sort);

  const [members, totalCount] = await Promise.all([
    database.member.findMany({
      where,
      select: memberSelect,
      skip,
      take,
      orderBy,
    }),
    database.member.count({ where }),
  ]);

  const pageCount = Math.ceil(totalCount / perPage);

  return {
    members: members.map((m) => ({
      ...m,
      role: m.role as OrgRoleName,
    })),
    totalCount,
    pageCount,
  };
}

function buildOrderBy(
  sort: MembersSearchParams["sort"]
):
  | Prisma.MemberOrderByWithRelationInput
  | Prisma.MemberOrderByWithRelationInput[] {
  if (sort.length === 0) {
    return { createdAt: "asc" };
  }

  return sort.map((s) => {
    const direction = s.desc ? "desc" : "asc";

    switch (s.id) {
      case "user":
        return {
          user: { name: direction },
        } as Prisma.MemberOrderByWithRelationInput;
      case "email":
        return {
          user: { email: direction },
        } as Prisma.MemberOrderByWithRelationInput;
      case "lastActiveAt":
        return {
          user: { lastActiveAt: direction },
        } as Prisma.MemberOrderByWithRelationInput;
      case "role":
        return { role: direction } as Prisma.MemberOrderByWithRelationInput;
      case "createdAt":
        return {
          createdAt: direction,
        } as Prisma.MemberOrderByWithRelationInput;
      default:
        return { createdAt: "asc" } as Prisma.MemberOrderByWithRelationInput;
    }
  });
}
