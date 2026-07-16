import { z } from "zod";

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 255;

export const profileSchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, `Name must be at least ${MIN_NAME_LENGTH} characters`)
    .max(
      MAX_NAME_LENGTH,
      `Name must be less than ${MAX_NAME_LENGTH} characters`
    ),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
