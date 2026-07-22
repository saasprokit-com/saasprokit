import "server-only";

import { database, type Prisma } from "@repo/database";
import type { GetListPayload } from "@/types/queries";
import type { UsersSearchParams } from "./validations";

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  image: true,
  role: true,
  banned: true,
  banReason: true,
  banExpires: true,
  twoFactorEnabled: true,
  createdAt: true,
  lastActiveAt: true,
  _count: { select: { members: true, sessions: true } },
} satisfies Prisma.UserSelect;

export type AdminUserRow = Prisma.UserGetPayload<{
  select: typeof adminUserSelect;
}>;

/**
 * A crafted `sort` URL param must never reach
 * unexposed or relation fields, so anything outside this allowlist is ignored.
 */
const SORTABLE_USER_COLUMNS = new Set([
  "name",
  "email",
  "role",
  "createdAt",
  "lastActiveAt",
  "banned",
]);

function buildOrderBy(
  sort: UsersSearchParams["sort"]
): Prisma.UserOrderByWithRelationInput {
  const orderBy: Prisma.UserOrderByWithRelationInput = {};
  for (const s of sort) {
    if (SORTABLE_USER_COLUMNS.has(s.id)) {
      (orderBy as Record<string, Prisma.SortOrder>)[s.id] = s.desc
        ? "desc"
        : "asc";
    }
  }
  if (Object.keys(orderBy).length === 0) {
    return { createdAt: "desc" };
  }
  return orderBy;
}

export async function getAdminUsers({
  page,
  perPage,
  sort,
  q,
  roles,
  status,
}: UsersSearchParams): Promise<GetListPayload<AdminUserRow>> {
  const skip = (page - 1) * perPage;
  const take = perPage;

  const where: Prisma.UserWhereInput = {};

  // Search filter (email + name, case-insensitive)
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  }

  // Role filter
  if (roles.length > 0) {
    where.role = { in: roles };
  }

  // Status filter — NOT covers the nullable `banned` column for "active".
  if (status === "banned") {
    where.banned = true;
  } else if (status === "active") {
    where.NOT = { banned: true };
  }

  const orderBy = buildOrderBy(sort);

  const [data, total] = await Promise.all([
    database.user.findMany({
      where,
      select: adminUserSelect,
      orderBy,
      skip,
      take,
    }),
    database.user.count({ where }),
  ]);

  const totalPage = Math.ceil(total / perPage);

  return { data, total, totalPage, limit: perPage, page };
}

const adminUserDetailSelect = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  image: true,
  role: true,
  banned: true,
  banReason: true,
  banExpires: true,
  twoFactorEnabled: true,
  createdAt: true,
  lastActiveAt: true,
  members: {
    select: {
      role: true,
      createdAt: true,
      organization: { select: { id: true, name: true, slug: true } },
    },
  },
  // token is DELIBERATELY excluded — raw session tokens must never reach the client.
  sessions: {
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
      ipAddress: true,
      userAgent: true,
      impersonatedBy: true,
    },
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.UserSelect;

export type AdminUserDetail = Prisma.UserGetPayload<{
  select: typeof adminUserDetailSelect;
}>;

export function getAdminUserDetail(
  userId: string
): Promise<AdminUserDetail | null> {
  return database.user.findUnique({
    where: { id: userId },
    select: adminUserDetailSelect,
  });
}
