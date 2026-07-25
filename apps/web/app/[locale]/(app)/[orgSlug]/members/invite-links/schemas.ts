import { ORG_ROLES } from "@repo/auth/permissions";
import {
  DEFAULT_INVITE_LINK_DAYS,
  MAX_INVITE_LINK_DAYS,
  MAX_INVITE_LINK_USES,
} from "@repo/utils/organization";
import { z } from "zod";

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

export const revokeInviteLinksSchema = z.object({
  organizationId: z.string().min(1),
  orgSlug: z.string().min(1),
  inviteLinkIds: z
    .array(z.string().min(1))
    .min(1, "Select at least one invite link"),
});

// .required keeps z.input === z.output for RHF + zodResolver (the dialog's
// Select always supplies expiresInDays, so the server-side default never fires).
export const createInviteLinkFormSchema = createInviteLinkSchema
  .pick({ role: true, expiresInDays: true, maxUses: true })
  .required({ expiresInDays: true });

export type CreateInviteLinkInput = z.infer<typeof createInviteLinkSchema>;
export type CreateInviteLinkFormValues = z.infer<
  typeof createInviteLinkFormSchema
>;
export type InviteLinkIdInput = z.infer<typeof inviteLinkIdSchema>;
export type RevokeInviteLinksInput = z.infer<typeof revokeInviteLinksSchema>;
