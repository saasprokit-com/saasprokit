import { z } from "zod";

export const deleteOrganizationSchema = z.object({
  organizationId: z.string().min(1),
});

export type DeleteOrganizationInput = z.infer<typeof deleteOrganizationSchema>;
