import "server-only";

import type { OrgRoleName } from "@repo/auth/permissions";
import { database, type Prisma } from "@repo/database";
import type { InvitationStatusValue } from "@repo/utils/organization";
import type { InvitationsSearchParams } from "./validations";

const invitationSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  expiresAt: true,
  createdAt: true,
  user: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.InvitationSelect;

type GetInvitationsInput = InvitationsSearchParams & {
  organizationId: string;
};

export async function getInvitations({
  organizationId,
  page,
  perPage,
  sort,
  search,
  role,
  status,
}: GetInvitationsInput) {
  const skip = (page - 1) * perPage;
  const take = perPage;

  const where: Prisma.InvitationWhereInput = {
    organizationId,
  };

  // Status filter
  if (status.length > 0) {
    where.status = { in: status };
  }

  // Search filter (email, case-insensitive)
  if (search) {
    where.email = { contains: search, mode: "insensitive" };
  }

  // Role filter
  if (role.length > 0) {
    where.role = { in: role };
  }

  const orderBy = buildOrderBy(sort);

  const [invitations, totalCount] = await Promise.all([
    database.invitation.findMany({
      where,
      select: invitationSelect,
      skip,
      take,
      orderBy,
    }),
    database.invitation.count({ where }),
  ]);

  // Transform: rename user -> inviter, omit the raw `user` key, narrow role type
  const transformedInvitations = invitations.map((inv) => {
    const { user, ...rest } = inv;
    return {
      ...rest,
      role: rest.role as OrgRoleName | null,
      status: rest.status as InvitationStatusValue,
      inviter: user,
    };
  });

  const pageCount = Math.ceil(totalCount / perPage);

  return { invitations: transformedInvitations, totalCount, pageCount };
}

function buildOrderBy(
  sort: InvitationsSearchParams["sort"]
):
  | Prisma.InvitationOrderByWithRelationInput
  | Prisma.InvitationOrderByWithRelationInput[] {
  if (sort.length === 0) {
    return { createdAt: "desc" };
  }

  return sort.map((s) => {
    const direction = s.desc ? "desc" : "asc";

    switch (s.id) {
      case "email":
        return {
          email: direction,
        } as Prisma.InvitationOrderByWithRelationInput;
      case "role":
        return { role: direction } as Prisma.InvitationOrderByWithRelationInput;
      case "createdAt":
        return {
          createdAt: direction,
        } as Prisma.InvitationOrderByWithRelationInput;
      case "expiresAt":
        return {
          expiresAt: direction,
        } as Prisma.InvitationOrderByWithRelationInput;
      default:
        return {
          createdAt: "desc",
        } as Prisma.InvitationOrderByWithRelationInput;
    }
  });
}
