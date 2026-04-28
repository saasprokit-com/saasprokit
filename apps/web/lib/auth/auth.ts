import "server-only";

import { auth } from "@repo/auth/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Get the current session on the server side.
 * Wrapped with React.cache() to deduplicate across a single request —
 * layout, page, and helper calls all share one auth roundtrip.
 */
export const getServerSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
});

/**
 * Get the current session or redirect to sign-in page.
 * Use this for protected routes that require authentication.
 */
export async function requireAuth(returnTo?: string) {
  const session = await getServerSession();

  if (!session) {
    const returnUrl = returnTo
      ? encodeURIComponent(returnTo)
      : encodeURIComponent("/user");
    redirect(`/auth/sign-in?returnTo=${returnUrl}`);
  }

  return session;
}

/**
 * Check if the current user has the given BA permission for an organization.
 * Returns { userId } on success, null on failure (no session or insufficient permissions).
 *
 * Reuses getServerSession() (React.cache-wrapped) so no extra auth roundtrip
 * if requireAuth or getServerSession was already called in the same request.
 */
export async function checkOrgPermission(
  organizationId: string,
  permissions: Record<string, string[]>
): Promise<{ userId: string } | null> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return null;
  }

  const result = await auth.api.hasPermission({
    headers: await headers(),
    body: { organizationId, permissions },
  });

  if (!result?.success) {
    return null;
  }

  return { userId: session.user.id };
}
