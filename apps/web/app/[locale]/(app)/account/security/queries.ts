import "server-only";

import { database, type Prisma } from "@repo/database";

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
    database.session.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: sessionSelect,
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
