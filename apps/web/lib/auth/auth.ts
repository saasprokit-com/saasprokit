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

export const getServerSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
});

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
