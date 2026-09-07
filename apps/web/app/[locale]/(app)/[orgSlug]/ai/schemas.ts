import { z } from "zod";
import { MAX_PROMPT_LENGTH } from "@/lib/ai/models";

const orgScope = {
  organizationId: z.string().min(1),
  orgSlug: z.string().min(1),
};

export const createConversationSchema = z.object(orgScope);
export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const deleteConversationSchema = z.object({
  ...orgScope,
  conversationId: z.string().min(1),
});
export type DeleteConversationInput = z.infer<typeof deleteConversationSchema>;

export const generateImageSchema = z.object({
  ...orgScope,
  conversationId: z.string().min(1),
  prompt: z.string().trim().min(1).max(MAX_PROMPT_LENGTH),
});
export type GenerateImageInput = z.infer<typeof generateImageSchema>;
