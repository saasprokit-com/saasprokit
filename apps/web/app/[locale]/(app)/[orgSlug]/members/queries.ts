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
  limit,
  sorts,
  q,
  roles,
}: ListMembersType): Promise<GetListPayload<Member>> {
  const skip = (page - 1) * limit;
  const take = limit;

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
  const orderBy = buildOrderBy(sorts);

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
    limit,
    totalPage: Math.ceil(total / limit),
  };
}

function buildOrderBy(
  sort: MembersSearchParams["sorts"]
): Prisma.MemberOrderByWithRelationInput {
  if (sort.length === 0) {
    return { createdAt: "asc" };
  }

  const memberOrderByWithRelationInput: Prisma.MemberOrderByWithRelationInput =
    {};

  sort.map((s) => {
    const direction = s.desc ? "desc" : "asc";

    switch (s.id) {
      case "user":
        return {
          ...memberOrderByWithRelationInput,
          user: {
            ...memberOrderByWithRelationInput?.user,
            name: direction,
          },
        };
      case "email":
        return {
          ...memberOrderByWithRelationInput,
          user: {
            ...memberOrderByWithRelationInput?.user,
            email: direction,
          },
        };
      case "lastActiveAt":
        return {
          ...memberOrderByWithRelationInput,
          user: {
            ...memberOrderByWithRelationInput?.user,
            email: direction,
          },
        };
      case "role":
        return {
          ...memberOrderByWithRelationInput,
          user: {
            ...memberOrderByWithRelationInput?.user,
            email: direction,
          },
        };
      case "createdAt":
        return {
          ...memberOrderByWithRelationInput,
          createdAt: direction,
        };
      default:
        return { createdAt: "asc" };
    }
  });

  return memberOrderByWithRelationInput;
}
