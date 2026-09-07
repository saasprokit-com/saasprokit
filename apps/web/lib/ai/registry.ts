import "server-only";

import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createProviderRegistry } from "ai";
import { mockProvider } from "@/lib/ai/mock";
import { AI_CHAT_MODELS, type AiModelOption } from "@/lib/ai/models";
import { env } from "@/lib/env";

export const registry = createProviderRegistry({
  anthropic: createAnthropic({ apiKey: env.ANTHROPIC_API_KEY }),
  mock: mockProvider,
  openai: createOpenAI({ apiKey: env.OPENAI_API_KEY }),
});

export function isConfigured(modelId: string): boolean {
  if (modelId.startsWith("mock:")) {
    return env.AI_MOCK === true;
  }
  if (modelId.startsWith("anthropic:")) {
    return Boolean(env.ANTHROPIC_API_KEY);
  }
  return Boolean(env.OPENAI_API_KEY);
}

export function availableChatModels(): AiModelOption[] {
  return AI_CHAT_MODELS.filter((model) => isConfigured(model.id));
}
