import "server-only";

import { database, type Prisma } from "@repo/database";
import { ACTIVE_STATUSES, PLAN_NAMES } from "@repo/utils/payment";
import type { GetListPayload } from "@/types/queries";
import type { OrgsSearchParams } from "./validations";

const adminOrgSelect = {
  id: true,
  name: true,
  slug: true,
  logo: true,
  createdAt: true,
  stripeCustomerId: true,
  _count: { select: { members: true } },
} satisfies Prisma.OrganizationSelect;

type AdminOrgBase = Prisma.OrganizationGetPayload<{
  select: typeof adminOrgSelect;
}>;

/**
 * Compact subscription summary merged onto each org row. Subscriptions have no
 * FK to Organization (linked by the plain `referenceId` string), so this is
 * fetched separately and merged in memory rather than joined.
 */
export interface AdminOrgSubscriptionSummary {
  periodEnd: Date | null;
  plan: string;
  seats: number | null;
  status: string | null;
}

export interface AdminOrgRow extends AdminOrgBase {
  subscription: AdminOrgSubscriptionSummary | null;
}

const ORG_SORT_COLUMNS = new Set(["name", "slug", "createdAt", "members"]);

function buildOrderBy(
  sort: OrgsSearchParams["sort"]
): Prisma.OrganizationOrderByWithRelationInput {
  const sortItem = sort.find((item) => ORG_SORT_COLUMNS.has(item.id));
  if (!sortItem) {
    return { createdAt: "desc" };
  }

  const direction: Prisma.SortOrder = sortItem.desc ? "desc" : "asc";
  if (sortItem.id === "members") {
    return { members: { _count: direction } };
  }
  return { [sortItem.id]: direction };
}

export async function getAdminOrgs({
  page,
  perPage,
  sort,
  q,
  plans,
}: OrgsSearchParams): Promise<GetListPayload<AdminOrgRow>> {
  const skip = (page - 1) * perPage;
  const take = perPage;

  const andConditions: Prisma.OrganizationWhereInput[] = [];

  // Search filter (name/slug, case-insensitive)
  if (q) {
    andConditions.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  // Plan filter. Subscriptions are not FK-related to organizations, so match by
  // pre-querying referenceIds. "free" means "no active subscription".
  if (plans.length > 0) {
    const paidPlans = plans.filter((name) => name !== PLAN_NAMES.FREE);
    const includeFree = plans.includes(PLAN_NAMES.FREE);
    const planConditions: Prisma.OrganizationWhereInput[] = [];

    if (paidPlans.length > 0) {
      const paidSubs = await database.subscription.findMany({
        where: {
          status: { in: [...ACTIVE_STATUSES] },
          plan: { in: paidPlans },
        },
        select: { referenceId: true },
      });
      planConditions.push({
        id: { in: [...new Set(paidSubs.map((sub) => sub.referenceId))] },
      });
    }

    if (includeFree) {
      const activeSubs = await database.subscription.findMany({
        where: { status: { in: [...ACTIVE_STATUSES] } },
        select: { referenceId: true },
      });
      planConditions.push({
        id: { notIn: [...new Set(activeSubs.map((sub) => sub.referenceId))] },
      });
    }

    if (planConditions.length > 0) {
      andConditions.push({ OR: planConditions });
    }
  }

  const where: Prisma.OrganizationWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const orderBy = buildOrderBy(sort);

  const [orgs, total] = await Promise.all([
    database.organization.findMany({
      where,
      select: adminOrgSelect,
      skip,
      take,
      orderBy,
    }),
    database.organization.count({ where }),
  ]);

  // Merge active subscriptions for the current page's orgs. Keep the most recent
  // per org (orderBy createdAt desc → first encountered wins).
  const pageOrgIds = orgs.map((org) => org.id);
  const subscriptions = pageOrgIds.length
    ? await database.subscription.findMany({
        where: {
          referenceId: { in: pageOrgIds },
          status: { in: [...ACTIVE_STATUSES] },
        },
        orderBy: { createdAt: "desc" },
        select: {
          referenceId: true,
          plan: true,
          status: true,
          periodEnd: true,
          seats: true,
        },
      })
    : [];

  const subscriptionByOrg = new Map<string, AdminOrgSubscriptionSummary>();
  for (const sub of subscriptions) {
    if (!subscriptionByOrg.has(sub.referenceId)) {
      subscriptionByOrg.set(sub.referenceId, {
        plan: sub.plan,
        status: sub.status,
        periodEnd: sub.periodEnd,
        seats: sub.seats,
      });
    }
  }

  const data: AdminOrgRow[] = orgs.map((org) => ({
    ...org,
    subscription: subscriptionByOrg.get(org.id) ?? null,
  }));

  const totalPage = Math.ceil(total / perPage);

  return { data, total, totalPage, limit: perPage, page };
}

const adminOrgDetailSelect = {
  id: true,
  name: true,
  slug: true,
  logo: true,
  createdAt: true,
  stripeCustomerId: true,
  members: {
    select: {
      id: true,
      role: true,
      createdAt: true,
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.OrganizationSelect;

type AdminOrgDetailBase = Prisma.OrganizationGetPayload<{
  select: typeof adminOrgDetailSelect;
}>;

export interface AdminOrgDetailSubscription {
  cancelAtPeriodEnd: boolean | null;
  id: string;
  periodEnd: Date | null;
  periodStart: Date | null;
  plan: string;
  seats: number | null;
  status: string | null;
  stripeCustomerId: string | null;
}

export interface AdminOrgDetail extends AdminOrgDetailBase {
  subscriptions: AdminOrgDetailSubscription[];
}

export async function getAdminOrgDetail(
  orgId: string
): Promise<AdminOrgDetail | null> {
  const org = await database.organization.findUnique({
    where: { id: orgId },
    select: adminOrgDetailSelect,
  });

  if (!org) {
    return null;
  }

  // Subscriptions link by referenceId (no FK relation) — fetched separately.
  const subscriptions = await database.subscription.findMany({
    where: { referenceId: orgId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      plan: true,
      status: true,
      periodStart: true,
      periodEnd: true,
      seats: true,
      cancelAtPeriodEnd: true,
      stripeCustomerId: true,
    },
  });

  return { ...org, subscriptions };
}
