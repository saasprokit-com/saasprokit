import { ADMIN_ROLES } from "@repo/auth/permissions";
import { z } from "zod";

export const targetUserSchema = z.object({
  userId: z.string().min(1),
});

export const setUserRoleSchema = targetUserSchema.extend({
  role: z.enum([ADMIN_ROLES.ADMIN, ADMIN_ROLES.MODERATOR, ADMIN_ROLES.USER]),
});

export const banUserSchema = targetUserSchema.extend({
  banReason: z.string().trim().min(1).max(500).optional(),
  banExpiresInDays: z.number().int().min(1).max(365).optional(),
});

export type TargetUserInput = z.infer<typeof targetUserSchema>;
export type SetUserRoleInput = z.infer<typeof setUserRoleSchema>;
export type BanUserInput = z.infer<typeof banUserSchema>;
