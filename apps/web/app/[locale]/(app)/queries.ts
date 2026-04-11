import "server-only";

import { database } from "@repo/database";

/**
 * Count how many organizations the user is a member of.
 * Used by the root app layout to detect first-login (zero memberships).
 */
export async function getUserMembershipCount(userId: string): Promise<number> {
  return await database.member.count({
    where: { userId },
  });
}
