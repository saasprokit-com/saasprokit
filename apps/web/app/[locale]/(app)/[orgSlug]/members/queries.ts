import "server-only";

import type { OrgRoleName } from "@repo/auth/permissions";
import { database, type Prisma } from "@repo/database";
import { INVITATION_STATUS } from "@repo/utils/organization";
import type { GetListPayload } from "@/types/queries";
import type { MembersSearchParams } from "./validations";

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

const listMemberSelect = {
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

export type Member = Prisma.MemberGetPayload<{
  select: typeof listMemberSelect;
}>;

export type ListMembersType = MembersSearchParams & {
  organizationId: string;
};

export async function getMembers({
  organizationId,
  page,
  perPage,
  sort,
  q,
  roles,
}: ListMembersType): Promise<GetListPayload<Member>> {
  const skip = (page - 1) * perPage;
  const take = perPage;

  // Build where clause
  const where: Prisma.MemberWhereInput = {
    organizationId,
  };

  // Search filter (name or email, case-insensitive)
  if (q) {
    where.user = {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    };
  }

  // Role filter
  if (roles.length > 0) {
    where.role = { in: roles };
  }

  // Build orderBy from sort state
  const orderBy = buildOrderBy(sort);

  const [members, total] = await Promise.all([
    database.member.findMany({
      where,
      select: listMemberSelect,
      skip,
      take,
      orderBy,
    }),
    database.member.count({ where }),
  ]);

  return {
    data: members.map((m) => ({
      ...m,
      role: m.role as OrgRoleName,
    })),
    total,
    page,
    limit: perPage,
    totalPage: Math.ceil(total / perPage),
  };
}

function buildOrderBy(
  sort: MembersSearchParams["sort"]
): Prisma.MemberOrderByWithRelationInput {
  if (sort.length === 0) {
    return { createdAt: "asc" };
  }
  return sort.reduce<Prisma.MemberOrderByWithRelationInput>(
    (accumulation, s) => {
      const direction = s.desc ? "desc" : "asc";

      switch (s.id) {
        case "user":
          return {
            ...accumulation,
            user: {
              ...accumulation.user,
              name: direction,
            },
          };
        case "email":
          return {
            ...accumulation,
            user: {
              ...accumulation.user,
              email: direction,
            },
          };
        default:
          return {
            ...accumulation,
            [s.id]: direction,
          };
      }
    },
    {}
  );
}
