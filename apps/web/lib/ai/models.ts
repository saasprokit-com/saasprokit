import { z } from "zod";

export interface AiModelOption {
  id: string;
  label: string;
}

export const AI_CHAT_MODELS = [
  { id: "anthropic:claude-opus-5", label: "Claude Opus 5" },
  { id: "anthropic:claude-sonnet-5", label: "Claude Sonnet 5" },
  { id: "openai:gpt-5.4", label: "GPT-5.4" },
  { id: "openai:gpt-5.4-mini", label: "GPT-5.4 mini" },
  { id: "mock:echo", label: "Mock (no cost)" },
] as const satisfies readonly AiModelOption[];

export type AiChatModelId = (typeof AI_CHAT_MODELS)[number]["id"];

export const IMAGE_MODEL = "openai:gpt-image-1";
export const MOCK_IMAGE_MODEL = "mock:image";

export const MAX_PROMPT_LENGTH = 8000;

const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().trim().min(1).max(MAX_PROMPT_LENGTH),
});

export const chatRequestSchema = z.object({
  id: z.string().min(1),
  modelId: z.enum(AI_CHAT_MODELS.map((model) => model.id)),
  message: z.object({
    id: z.string().min(1),
    role: z.literal("user"),
    parts: z.array(textPartSchema).min(1),
  }),
});
