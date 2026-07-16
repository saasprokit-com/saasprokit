import "server-only";

import { auth } from "@repo/auth/server";
import { database, type Prisma } from "@repo/database";
import { headers } from "next/headers";

const sessionSelect = {
  id: true,
  ipAddress: true,
  userAgent: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SessionSelect;

export type SecuritySession = Prisma.SessionGetPayload<{
  select: typeof sessionSelect;
}>;

export async function getSecurityPageData(userId: string) {
  const [sessions, twoFactorRecord] = await Promise.all([
    auth.api.listSessions({
      headers: await headers(),
    }),
    database.twoFactor.findFirst({
      where: { userId },
    }),
  ]);

  return {
    sessions,
    twoFactorEnabled: !!twoFactorRecord,
  };
}
