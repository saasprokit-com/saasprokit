import {
  MAX_ORG_NAME_LENGTH,
  MIN_ORG_NAME_LENGTH,
} from "@repo/utils/organization";
import { slugSchema } from "@repo/utils/slug";
import { z } from "zod";

export const createOrgSchema = z.object({
  name: z.string().min(MIN_ORG_NAME_LENGTH).max(MAX_ORG_NAME_LENGTH),
  slug: slugSchema,
});

export type CreateOrgInput = z.infer<typeof createOrgSchema>;
