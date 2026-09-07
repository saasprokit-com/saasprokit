import "server-only";

import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createProviderRegistry } from "ai";
import { AI_CHAT_MODELS, type AiModelOption } from "@/lib/ai/models";
import { env } from "@/lib/env";

export const registry = createProviderRegistry({
  anthropic: createAnthropic({ apiKey: env.ANTHROPIC_API_KEY }),
  openai: createOpenAI({ apiKey: env.OPENAI_API_KEY }),
});

export function isConfigured(modelId: string): boolean {
  return Boolean(
    modelId.startsWith("anthropic:")
      ? env.ANTHROPIC_API_KEY
      : env.OPENAI_API_KEY
  );
}

export function availableChatModels(): AiModelOption[] {
  return AI_CHAT_MODELS.filter((model) => isConfigured(model.id));
}
