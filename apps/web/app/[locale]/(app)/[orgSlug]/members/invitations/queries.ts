import "server-only";
import { database, type Prisma } from "@repo/database";
import type { GetListPayload } from "@/types/queries";
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

export type Invitation = Prisma.InvitationGetPayload<{
  select: typeof invitationSelect;
}>;

type GetInvitationsInput = InvitationsSearchParams & {
  organizationId: string;
};

export async function getInvitations({
  organizationId,
  page,
  perPage,
  sort,
  q,
  roles,
  statuses,
}: GetInvitationsInput): Promise<GetListPayload<Invitation>> {
  const skip = (page - 1) * perPage;
  const take = perPage;

  const where: Prisma.InvitationWhereInput = {
    organizationId,
  };

  // Status filter
  if (statuses.length > 0) {
    where.status = { in: statuses };
  }

  // Search filter (email, case-insensitive)
  if (q) {
    where.email = { contains: q, mode: "insensitive" };
  }

  // Role filter
  if (roles.length > 0) {
    where.role = { in: roles };
  }

  const orderBy = buildOrderBy(sort);

  const [invitations, total] = await Promise.all([
    database.invitation.findMany({
      where,
      select: invitationSelect,
      skip,
      take,
      orderBy,
    }),
    database.invitation.count({ where }),
  ]);

  const totalPage = Math.ceil(total / perPage);

  return { data: invitations, total, totalPage, limit: perPage };
}

const SORTABLE_INVITATION_COLUMNS = new Set([
  "email",
  "role",
  "status",
  "createdAt",
]);

function buildOrderBy(
  sort: InvitationsSearchParams["sort"]
): Prisma.InvitationOrderByWithRelationInput {
  const orderBy: Prisma.InvitationOrderByWithRelationInput = {};
  for (const s of sort) {
    if (SORTABLE_INVITATION_COLUMNS.has(s.id)) {
      (orderBy as Record<string, Prisma.SortOrder>)[s.id] = s.desc
        ? "desc"
        : "asc";
    }
  }
  return Object.keys(orderBy).length > 0 ? orderBy : { createdAt: "desc" };
}
