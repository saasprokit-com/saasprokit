import { z } from "zod";

export const acceptInvitationSchema = z.object({
  invitationId: z.string().min(1, "Invalid invitation"),
});

export const acceptInviteLinkSchema = z.object({
  token: z.string().min(1, "Invalid invite link"),
});
