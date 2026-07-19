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

/**
 * The admin plugin's `role` column is nullable and cookie-cached (up to
 * COOKIE_CACHE_MAX_AGE_MINUTES stale). Every admin gate re-reads it from the DB so a
 * just-demoted or just-banned admin loses access immediately. Memoized per request.
 */
const getFreshRole = cache((userId: string) =>
  database.user.findUnique({
    where: { id: userId },
    select: { role: true, banned: true },
  })
);

/**
 * Gate for the /admin layout AND every /admin page (layouts don't re-run on soft
 * navigation, so each page re-asserts). Redirects anonymous users to sign-in;
 * returns 404 — not 403 — for authenticated non-staff, so the area's existence
 * isn't disclosed. Never trusts the cookie-cached session role.
 */
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
