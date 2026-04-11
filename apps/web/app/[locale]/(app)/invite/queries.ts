import "server-only";

import { database, type Prisma } from "@repo/database";
import { z } from "zod";

const invitationDetailSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  expiresAt: true,
  organization: {
    select: { name: true, slug: true, logo: true },
  },
  user: {
    select: { name: true },
  },
} satisfies Prisma.InvitationSelect;

export type InvitationDetail = Prisma.InvitationGetPayload<{
  select: typeof invitationDetailSelect;
}>;

const inviteLinkDetailSelect = {
  id: true,
  role: true,
  expiresAt: true,
  maxUses: true,
  usedCount: true,
  isActive: true,
  organization: {
    select: { name: true, slug: true, logo: true },
  },
  createdBy: {
    select: { name: true },
  },
} satisfies Prisma.InviteLinkSelect;

export type InviteLinkDetail = Prisma.InviteLinkGetPayload<{
  select: typeof inviteLinkDetailSelect;
}>;

const MAX_TOKEN_LENGTH = 255;
const tokenSchema = z.string().min(1).max(MAX_TOKEN_LENGTH);

/**
 * Get invitation details (for preview before accepting)
 */
export async function getInvitationDetails(invitationId: string) {
  const parsed = tokenSchema.safeParse(invitationId);
  if (!parsed.success) {
    return null;
  }

  return await database.invitation.findUnique({
    where: { id: parsed.data },
    select: invitationDetailSelect,
  });
}

/**
 * Get invite link details (for preview before accepting)
 */
export async function getInviteLinkDetails(token: string) {
  const parsed = tokenSchema.safeParse(token);
  if (!parsed.success) {
    return null;
  }

  return await database.inviteLink.findUnique({
    where: { token: parsed.data },
    select: inviteLinkDetailSelect,
  });
}
