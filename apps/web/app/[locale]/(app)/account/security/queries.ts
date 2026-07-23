import "server-only";

import { database, type Prisma } from "@repo/database";

const sessionSelect = {
  id: true,
  token: true,
  ipAddress: true,
  userAgent: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SessionSelect;

export type SecuritySession = Prisma.SessionGetPayload<{
  select: typeof sessionSelect;
}>;

export function getUserSessions(userId: string): Promise<SecuritySession[]> {
  return database.session.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: sessionSelect,
  });
}
