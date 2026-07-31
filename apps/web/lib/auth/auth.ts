import "server-only";

import { auth } from "@repo/auth/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { PAGE_ROUTES } from "../routes";

export interface ActionResult<T = void> {
  code?: string;
  data?: T;
  error?: string;
  success: boolean;
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
      : encodeURIComponent(PAGE_ROUTES.ORG);
    redirect(`${PAGE_ROUTES.SIGN_IN}?callbackUrl=${returnUrl}`);
  }

  return session;
}

export async function hasOrgPermission(
  organizationId: string,
  permissions: Record<string, string[]>
): Promise<boolean> {
  const result = await auth.api.hasPermission({
    headers: await headers(),
    body: { organizationId, permissions },
  });

  return result?.success ?? false;
}
