import "server-only";
import { database, type Prisma } from "@repo/database";
import { INVITE_LINK_STATUS } from "@repo/utils/organization";
import type { GetListPayload } from "@/types/queries";
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

export type InviteLink = Prisma.InviteLinkGetPayload<{
  select: typeof inviteLinkSelect;
}>;

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
}: GetInviteLinksInput): Promise<GetListPayload<InviteLink>> {
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

  const [inviteLinks, total] = await Promise.all([
    database.inviteLink.findMany({
      where,
      select: inviteLinkSelect,
      skip,
      take,
      orderBy,
    }),
    database.inviteLink.count({ where }),
  ]);

  const totalPage = Math.ceil(total / perPage);

  return {
    data: inviteLinks,
    total,
    limit: perPage,
    totalPage,
  };
}

function buildOrderBy(
  sort: InviteLinksSearchParams["sort"]
): Prisma.InviteLinkOrderByWithRelationInput {
  if (sort.length === 0) {
    return { createdAt: "desc" };
  }

  const orderBy: Prisma.InviteLinkOrderByWithRelationInput = {};
  for (const s of sort) {
    (orderBy as Record<string, Prisma.SortOrder>)[s.id] = s.desc
      ? "desc"
      : "asc";
  }
  return orderBy;
}
