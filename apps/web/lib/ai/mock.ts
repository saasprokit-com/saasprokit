import {
  MockImageModelV4,
  MockLanguageModelV4,
  MockProviderV4,
  simulateReadableStream,
} from "ai/test";

const REPLY =
  "This is a mock reply. No provider was called and nothing was billed. Switch AI_MOCK off and set a real API key to talk to a live model.";

const TRANSPARENT_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const CHUNK_DELAY_MS = 40;
const MOCK_INPUT_TOKENS = 12;
const MOCK_OUTPUT_TOKENS = 24;

export const mockProvider = new MockProviderV4({
  languageModels: {
    echo: new MockLanguageModelV4({
      doStream: () =>
        Promise.resolve({
          stream: simulateReadableStream({
            chunkDelayInMs: CHUNK_DELAY_MS,
            chunks: [
              { type: "stream-start", warnings: [] },
              { type: "text-start", id: "0" },
              ...REPLY.split(" ").map((word) => ({
                type: "text-delta" as const,
                id: "0",
                delta: `${word} `,
              })),
              { type: "text-end", id: "0" },
              {
                type: "finish",
                finishReason: { unified: "stop", raw: "stop" },
                usage: {
                  inputTokens: {
                    total: MOCK_INPUT_TOKENS,
                    noCache: MOCK_INPUT_TOKENS,
                    cacheRead: 0,
                    cacheWrite: 0,
                  },
                  outputTokens: {
                    total: MOCK_OUTPUT_TOKENS,
                    text: MOCK_OUTPUT_TOKENS,
                    reasoning: 0,
                  },
                },
              },
            ],
          }),
        }),
    }),
  },
  imageModels: {
    image: new MockImageModelV4({
      doGenerate: () =>
        Promise.resolve({
          images: [TRANSPARENT_PNG],
          warnings: [],
          response: {
            timestamp: new Date(),
            modelId: "mock:image",
            headers: undefined,
          },
        }),
    }),
  },
});
