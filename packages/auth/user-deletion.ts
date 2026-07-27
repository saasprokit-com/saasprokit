import { database } from "@repo/database";
import { APIError } from "better-auth/api";
import { ORG_ROLES } from "./permissions";
import { stripeClient } from "./stripe-client";

// Stripe subscription statuses that are already inactive and need no cancelling.
const INACTIVE_STRIPE_STATUSES = new Set([
  "canceled",
  "incomplete",
  "incomplete_expired",
]);

export async function cancelActiveStripeSubscriptions(
  customerId: string | null
): Promise<void> {
  if (!(stripeClient && customerId)) {
    return;
  }

  for await (const sub of stripeClient.subscriptions.list({
    customer: customerId,
    status: "all",
  })) {
    if (!INACTIVE_STRIPE_STATUSES.has(sub.status)) {
      await stripeClient.subscriptions.cancel(sub.id);
    }
  }
}

export async function cleanUpUserBeforeDelete(user: {
  id: string;
  stripeCustomerId?: string | null;
}): Promise<void> {
  const userId = user.id;

  const ownedOrgs = await database.member.findMany({
    where: { userId, role: ORG_ROLES.OWNER },
    select: { organizationId: true },
  });

  const soloOrgs: { id: string; stripeCustomerId: string | null }[] = [];
  for (const { organizationId } of ownedOrgs) {
    const otherOwners = await database.member.count({
      where: { organizationId, role: ORG_ROLES.OWNER, userId: { not: userId } },
    });
    if (otherOwners > 0) {
      continue; // Org keeps an owner after this user leaves.
    }

    const otherMembers = await database.member.count({
      where: { organizationId, userId: { not: userId } },
    });
    if (otherMembers > 0) {
      throw new APIError("BAD_REQUEST", {
        code: "TRANSFER_ORGANIZATION_OWNERSHIP",
        message:
          "Transfer ownership of your organizations before deleting your account.",
      });
    }

    const org = await database.organization.findUnique({
      where: { id: organizationId },
      select: { stripeCustomerId: true },
    });
    soloOrgs.push({
      id: organizationId,
      stripeCustomerId: org?.stripeCustomerId ?? null,
    });
  }

  await database.$transaction([
    database.subscription.deleteMany({ where: { referenceId: userId } }),
    ...soloOrgs.flatMap((org) => [
      database.organization.delete({ where: { id: org.id } }),
      database.subscription.deleteMany({ where: { referenceId: org.id } }),
    ]),
  ]);

  await cancelActiveStripeSubscriptions(user.stripeCustomerId ?? null);
  for (const org of soloOrgs) {
    await cancelActiveStripeSubscriptions(org.stripeCustomerId);
  }
}
