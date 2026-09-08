import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  env: {
    AI_MOCK: undefined as boolean | undefined,
    ANTHROPIC_API_KEY: undefined as string | undefined,
    OPENAI_API_KEY: undefined as string | undefined,
  },
}));

vi.mock("@/lib/env", () => ({ env: mocks.env }));

describe("isConfigured", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.env.AI_MOCK = undefined;
    mocks.env.ANTHROPIC_API_KEY = undefined;
    mocks.env.OPENAI_API_KEY = undefined;
  });

  it("never offers mock models when AI_MOCK is unset", async () => {
    const { availableChatModels, isConfigured } = await import("./registry");
    expect(isConfigured("mock:echo")).toBe(false);
    expect(isConfigured("mock:image")).toBe(false);
    expect(availableChatModels()).toEqual([]);
  });

  it("offers only the mock model when AI_MOCK is on and no API key is set", async () => {
    mocks.env.AI_MOCK = true;
    const { availableChatModels, isConfigured } = await import("./registry");
    expect(isConfigured("mock:echo")).toBe(true);
    expect(availableChatModels().map((model) => model.id)).toEqual([
      "mock:echo",
    ]);
  });

  it("still gates real providers on their own key", async () => {
    mocks.env.AI_MOCK = true;
    mocks.env.ANTHROPIC_API_KEY = "sk-ant-test";
    const { availableChatModels } = await import("./registry");
    expect(availableChatModels().map((model) => model.id)).toEqual([
      "anthropic:claude-opus-5",
      "anthropic:claude-sonnet-5",
      "mock:echo",
    ]);
  });
});
