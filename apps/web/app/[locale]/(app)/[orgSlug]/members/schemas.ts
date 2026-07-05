import { ORG_ROLES } from "@repo/auth/permissions";
import {
  DEFAULT_INVITE_LINK_DAYS,
  MAX_BULK_INVITE_COUNT,
  MAX_INVITE_LINK_DAYS,
  MAX_INVITE_LINK_USES,
} from "@repo/utils/organization";
import { z } from "zod";

export const emailSchema = z.email();

export const inviteMemberSchema = z.object({
  organizationId: z.string().min(1),
  orgSlug: z.string().min(1),
  email: z.email("Invalid email address"),
  role: z.enum([ORG_ROLES.ADMIN, ORG_ROLES.MEMBER]), // Cannot invite as owner
});

export const removeMembersSchema = z.object({
  organizationId: z.string().min(1),
  orgSlug: z.string().min(1),
  memberIds: z.array(z.string().min(1)).min(1, "Select at least one member"),
});

export const updateRoleSchema = z.object({
  organizationId: z.string().min(1),
  orgSlug: z.string().min(1),
  memberId: z.string().min(1),
  newRole: z.enum([ORG_ROLES.ADMIN, ORG_ROLES.MEMBER]), // Cannot change to/from owner
});

export const invitationIdSchema = z.object({
  invitationId: z.string().min(1),
  organizationId: z.string().min(1),
  orgSlug: z.string().min(1),
});

export const bulkInviteSchema = z.object({
  organizationId: z.string().min(1),
  orgSlug: z.string().min(1),
  emails: z
    .array(
      z
        .email("Invalid email format")
        .toLowerCase() // Normalize case
        .trim() // Remove whitespace
    )
    .min(1, "At least one email is required")
    .max(
      MAX_BULK_INVITE_COUNT,
      `Maximum ${MAX_BULK_INVITE_COUNT} emails allowed`
    )
    // SECURITY: Validate no duplicate emails in single request
    .refine(
      (emails) => new Set(emails).size === emails.length,
      "Duplicate emails are not allowed"
    ),
  role: z.enum([ORG_ROLES.ADMIN, ORG_ROLES.MEMBER]),
});

export const suspendMemberSchema = z.object({
  organizationId: z.string().min(1),
  orgSlug: z.string().min(1),
  memberId: z.string().min(1),
  reason: z.string().optional(),
});

export const reactivateMemberSchema = z.object({
  organizationId: z.string().min(1),
  orgSlug: z.string().min(1),
  memberId: z.string().min(1),
});

export const createInviteLinkSchema = z.object({
  organizationId: z.string().min(1),
  orgSlug: z.string().min(1),
  role: z.enum([ORG_ROLES.ADMIN, ORG_ROLES.MEMBER]),
  expiresInDays: z
    .number()
    .min(1)
    .max(MAX_INVITE_LINK_DAYS)
    .optional()
    .default(DEFAULT_INVITE_LINK_DAYS),
  maxUses: z.number().min(1).max(MAX_INVITE_LINK_USES).optional(),
});

export const inviteLinkIdSchema = z.object({
  inviteLinkId: z.string().min(1),
  organizationId: z.string().min(1),
  orgSlug: z.string().min(1),
});

export const cancelInvitationsSchema = z.object({
  organizationId: z.string().min(1),
  orgSlug: z.string().min(1),
  invitationIds: z
    .array(z.string().min(1))
    .min(1, "Select at least one invitation"),
});

export const revokeInviteLinksSchema = z.object({
  organizationId: z.string().min(1),
  orgSlug: z.string().min(1),
  inviteLinkIds: z
    .array(z.string().min(1))
    .min(1, "Select at least one invite link"),
});

export const transferOwnershipSchema = z.object({
  organizationId: z.string().min(1),
  orgSlug: z.string().min(1),
  newOwnerMemberId: z.string().min(1),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type RemoveMembersInput = z.infer<typeof removeMembersSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type InvitationIdInput = z.infer<typeof invitationIdSchema>;
export type BulkInviteInput = z.infer<typeof bulkInviteSchema>;
export type SuspendMemberInput = z.infer<typeof suspendMemberSchema>;
export type ReactivateMemberInput = z.infer<typeof reactivateMemberSchema>;
export type CreateInviteLinkInput = z.infer<typeof createInviteLinkSchema>;
export type InviteLinkIdInput = z.infer<typeof inviteLinkIdSchema>;
export type CancelInvitationsInput = z.infer<typeof cancelInvitationsSchema>;
export type RevokeInviteLinksInput = z.infer<typeof revokeInviteLinksSchema>;
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;
