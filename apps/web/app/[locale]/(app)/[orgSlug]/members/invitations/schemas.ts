import { z } from "zod";

export const invitationIdSchema = z.object({
  invitationId: z.string().min(1),
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

export type InvitationIdInput = z.infer<typeof invitationIdSchema>;
export type CancelInvitationsInput = z.infer<typeof cancelInvitationsSchema>;
