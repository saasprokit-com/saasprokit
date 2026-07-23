import "server-only";

import { canAdmin, isAdminAreaRole } from "@repo/auth/permissions";
import { database } from "@repo/database";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PAGE_ROUTES } from "@/lib/routes";
import { getServerSession, requireAuth } from "./auth";

export interface AdminContext {
  /** True for admin, false for moderator (canAdmin(role, { user: ["list"] })). */
  isAdmin: boolean;
  userId: string;
}

const getFreshRole = cache((userId: string) =>
  database.user.findUnique({
    where: { id: userId },
    select: { role: true, banned: true },
  })
);

export const requireAdminArea = cache(async (): Promise<AdminContext> => {
  const session = await requireAuth(PAGE_ROUTES.ADMIN);
  const user = await getFreshRole(session.user.id);

  if (!user || user.banned === true || !isAdminAreaRole(user.role)) {
    notFound();
  }

  return {
    userId: session.user.id,
    isAdmin: canAdmin(user.role, { user: ["list"] }),
  };
});

export async function hasAdminPermission(
  permissions: Record<string, string[]>
): Promise<boolean> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return false;
  }

  const user = await getFreshRole(session.user.id);
  if (!user || user.banned === true) {
    return false;
  }

  return canAdmin(user.role, permissions);
}
