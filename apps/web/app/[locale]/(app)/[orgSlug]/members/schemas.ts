import { ORG_ROLES } from "@repo/auth/permissions";
import { MAX_BULK_INVITE_COUNT } from "@repo/utils/organization";
import { z } from "zod";

export const emailSchema = z.email();

export const inviteMemberSchema = z.object({
  organizationId: z.string().min(1),
  orgSlug: z.string().min(1),
  email: z.email("Invalid email address"),
  role: z.enum([ORG_ROLES.ADMIN, ORG_ROLES.MEMBER]), // Cannot invite as owner
});

// RHF fields only; organizationId/orgSlug are merged into the dispatch payload
export const inviteMemberFormSchema = inviteMemberSchema.pick({
  email: true,
  role: true,
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

// RHF fields only; the action re-parses the raw textarea string server-side
export const bulkInviteFormSchema = z.object({
  emails: z.string().min(1, "At least one email is required"),
  role: z.enum([ORG_ROLES.ADMIN, ORG_ROLES.MEMBER]),
});

export const bulkInviteActionSchema = bulkInviteFormSchema.extend({
  organizationId: z.string().min(1),
  orgSlug: z.string().min(1),
});

/**
 * Partition parsed emails into valid/invalid, skipping duplicates. Shared by
 * the bulk-invite dialog's live badge and the server action so both drop the
 * same invalid entries instead of failing the whole submit.
 */
export function validateEmails(emails: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const email of emails) {
    if (seen.has(email)) {
      continue; // Skip duplicates
    }
    seen.add(email);

    if (emailSchema.safeParse(email).success) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  }

  return { valid, invalid };
}

export const transferOwnershipSchema = z.object({
  organizationId: z.string().min(1),
  orgSlug: z.string().min(1),
  newOwnerMemberId: z.string().min(1),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type InviteMemberFormValues = z.infer<typeof inviteMemberFormSchema>;
export type RemoveMembersInput = z.infer<typeof removeMembersSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type BulkInviteInput = z.infer<typeof bulkInviteSchema>;
export type BulkInviteFormValues = z.infer<typeof bulkInviteFormSchema>;
export type BulkInviteActionInput = z.infer<typeof bulkInviteActionSchema>;
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;
