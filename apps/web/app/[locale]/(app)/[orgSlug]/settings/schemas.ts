import {
  MAX_ORG_NAME_LENGTH,
  MIN_ORG_NAME_LENGTH,
} from "@repo/utils/organization";
import { z } from "zod";

export const updateOrgSchema = z.object({
  name: z
    .string()
    .min(MIN_ORG_NAME_LENGTH, "Name must be at least 2 characters")
    .max(MAX_ORG_NAME_LENGTH, "Name must be less than 100 characters"),
});

export type UpdateOrgFormValues = z.infer<typeof updateOrgSchema>;

export const updateOrgActionSchema = z.object({
  organizationId: z.string().min(1, "Organization ID required"),
  name: z
    .string()
    .min(MIN_ORG_NAME_LENGTH, "Name must be at least 2 characters")
    .max(MAX_ORG_NAME_LENGTH, "Name must be less than 100 characters"),
});

export const deleteOrgActionSchema = z.object({
  organizationId: z.string().min(1, "Organization ID required"),
});

export const removeLogoSchema = z.object({
  organizationId: z.string().min(1, "Organization ID required"),
});

export const revalidateOrgSettingsSchema = z.object({
  orgSlug: z.string().min(1, "Organization slug required"),
});
