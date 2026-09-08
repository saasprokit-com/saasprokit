import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  convertToModelMessages: vi.fn(),
  createUIMessageStreamResponse: vi.fn(),
  getAiQuotaStatus: vi.fn(),
  getOwnedConversation: vi.fn(),
  getServerSession: vi.fn(),
  isConfigured: vi.fn(),
  isWithinAiQuota: vi.fn(),
  languageModel: vi.fn(),
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
  recordAiUsage: vi.fn(),
  saveMessages: vi.fn(),
  streamText: vi.fn(),
  toUIMessageStream: vi.fn(),
  validateOrganizationMembership: vi.fn(),
}));

vi.mock("ai", () => ({
  convertToModelMessages: mocks.convertToModelMessages,
  createIdGenerator: () => () => "msg_generated",
  createUIMessageStreamResponse: mocks.createUIMessageStreamResponse,
  streamText: mocks.streamText,
  toUIMessageStream: mocks.toUIMessageStream,
}));
vi.mock("@repo/logger/log", () => ({
  createRequestLogger: () => mocks.logger,
}));
vi.mock("@/lib/ai/registry", () => ({
  isConfigured: mocks.isConfigured,
  registry: { languageModel: mocks.languageModel },
}));
vi.mock("@/lib/ai/queries", () => ({
  getAiQuotaStatus: mocks.getAiQuotaStatus,
  getOwnedConversation: mocks.getOwnedConversation,
  isWithinAiQuota: mocks.isWithinAiQuota,
}));
vi.mock("@/lib/ai/actions", () => ({
  recordAiUsage: mocks.recordAiUsage,
  saveMessages: mocks.saveMessages,
}));
vi.mock("@/lib/auth/auth", () => ({ getServerSession: mocks.getServerSession }));
vi.mock("@/lib/organization/queries", () => ({
  validateOrganizationMembership: mocks.validateOrganizationMembership,
}));

import { POST } from "./route";

const userMessage = {
  id: "m_user",
  role: "user",
  parts: [{ type: "text", text: "Hello there" }],
};

function request(body: unknown) {
  return new Request("http://localhost/api/ai/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  id: "c1",
  modelId: "anthropic:claude-opus-5",
  message: userMessage,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getServerSession.mockResolvedValue({ user: { id: "user_1" } });
  mocks.getOwnedConversation.mockResolvedValue({
    id: "c1",
    organizationId: "org_1",
    messages: [
      {
        id: "m0",
        role: "assistant",
        parts: [{ type: "file", mediaType: "image/png", url: "/x.png" }],
      },
    ],
  });
  mocks.validateOrganizationMembership.mockResolvedValue(true);
  mocks.isConfigured.mockReturnValue(true);
  mocks.getAiQuotaStatus.mockResolvedValue({ usage: {}, limits: {} });
  mocks.isWithinAiQuota.mockReturnValue(true);
  mocks.languageModel.mockReturnValue("language-model");
  mocks.convertToModelMessages.mockResolvedValue(["model-messages"]);
  mocks.streamText.mockReturnValue({ stream: "text-stream" });
  mocks.toUIMessageStream.mockReturnValue("ui-stream");
  mocks.createUIMessageStreamResponse.mockReturnValue(new Response("ok"));
  mocks.saveMessages.mockResolvedValue(undefined);
});

describe("POST /api/ai/chat", () => {
  it("returns 401 without a session", async () => {
    mocks.getServerSession.mockResolvedValue(null);
    expect((await POST(request(validBody))).status).toBe(401);
    expect(mocks.streamText).not.toHaveBeenCalled();
  });

  it("returns 400 on an invalid body", async () => {
    expect((await POST(request({ id: "c1" }))).status).toBe(400);
  });

  it("returns 404 when the conversation is not owned by the caller", async () => {
    mocks.getOwnedConversation.mockResolvedValue(null);
    expect((await POST(request(validBody))).status).toBe(404);
  });

  it("returns 403 when the caller is no longer an org member", async () => {
    mocks.validateOrganizationMembership.mockResolvedValue(false);
    expect((await POST(request(validBody))).status).toBe(403);
  });

  it("returns 400 when the model's provider is not configured", async () => {
    mocks.isConfigured.mockReturnValue(false);
    expect((await POST(request(validBody))).status).toBe(400);
    expect(mocks.isConfigured).toHaveBeenCalledWith("anthropic:claude-opus-5");
  });

  it("returns 429 when the monthly token quota is exhausted", async () => {
    mocks.isWithinAiQuota.mockReturnValue(false);
    const response = await POST(request(validBody));
    expect(response.status).toBe(429);
    expect(mocks.saveMessages).not.toHaveBeenCalled();
  });

  it("persists the user message, streams with the selected model and records usage", async () => {
    const response = await POST(request(validBody));
    expect(response.status).toBe(200);

    expect(mocks.saveMessages).toHaveBeenCalledWith("c1", [userMessage]);
    expect(mocks.languageModel).toHaveBeenCalledWith("anthropic:claude-opus-5");

    const converted = mocks.convertToModelMessages.mock.calls[0]?.[0] as Array<{
      parts: unknown[];
    }>;
    expect(
      converted.every((message) =>
        message.parts.every((part) => (part as { type: string }).type === "text")
      )
    ).toBe(true);

    const streamArgs = mocks.streamText.mock.calls[0]?.[0] as {
      model: unknown;
      instructions: string;
      onEnd: (event: { totalUsage: unknown }) => Promise<void>;
    };
    expect(streamArgs.model).toBe("language-model");
    expect(typeof streamArgs.instructions).toBe("string");
    await streamArgs.onEnd({
      totalUsage: { inputTokens: 5, outputTokens: 7, totalTokens: 12 },
    });
    expect(mocks.recordAiUsage).toHaveBeenCalledWith({
      organizationId: "org_1",
      userId: "user_1",
      modelId: "anthropic:claude-opus-5",
      totalTokens: 12,
    });

    const uiArgs = mocks.toUIMessageStream.mock.calls[0]?.[0] as {
      stream: unknown;
      originalMessages: unknown[];
      onEnd: (event: { responseMessage: unknown }) => Promise<void>;
    };
    expect(uiArgs.stream).toBe("text-stream");
    expect(uiArgs.originalMessages).toHaveLength(2);
    const assistant = {
      id: "msg_generated",
      role: "assistant",
      parts: [{ type: "text", text: "Hi" }],
    };
    await uiArgs.onEnd({ responseMessage: assistant });
    expect(mocks.saveMessages).toHaveBeenLastCalledWith("c1", [assistant]);
  });

  it("derives total usage when the SDK omits totalTokens", async () => {
    await POST(request(validBody));
    const streamArgs = mocks.streamText.mock.calls[0]?.[0] as {
      onEnd: (event: { totalUsage: unknown }) => Promise<void>;
    };

    await streamArgs.onEnd({
      totalUsage: { inputTokens: 5, outputTokens: 7 },
    });

    expect(mocks.recordAiUsage).toHaveBeenCalledWith({
      organizationId: "org_1",
      userId: "user_1",
      modelId: "anthropic:claude-opus-5",
      totalTokens: 12,
    });
  });

  it("logs and swallows usage persistence failures", async () => {
    await POST(request(validBody));
    const streamArgs = mocks.streamText.mock.calls[0]?.[0] as {
      onEnd: (event: { totalUsage: unknown }) => Promise<void>;
    };
    const err = new Error("usage persistence failed");
    mocks.recordAiUsage.mockRejectedValueOnce(err);

    await expect(
      streamArgs.onEnd({
        totalUsage: { inputTokens: 5, outputTokens: 7, totalTokens: 12 },
      })
    ).resolves.toBeUndefined();
    expect(mocks.logger.error).toHaveBeenCalledWith(
      "Failed to record chat usage",
      {
        err,
        conversationId: "c1",
        modelId: "anthropic:claude-opus-5",
      }
    );
  });

  it("logs and swallows assistant persistence failures", async () => {
    await POST(request(validBody));
    const uiArgs = mocks.toUIMessageStream.mock.calls[0]?.[0] as {
      onEnd: (event: { responseMessage: unknown }) => Promise<void>;
    };
    const assistant = {
      id: "msg_generated",
      role: "assistant",
      parts: [{ type: "text", text: "Hi" }],
    };
    const err = new Error("assistant persistence failed");
    mocks.saveMessages.mockRejectedValueOnce(err);

    await expect(
      uiArgs.onEnd({ responseMessage: assistant })
    ).resolves.toBeUndefined();
    expect(mocks.logger.error).toHaveBeenCalledWith(
      "Failed to persist assistant message",
      {
        err,
        conversationId: "c1",
        modelId: "anthropic:claude-opus-5",
      }
    );
  });

  it("warns when coerced token usage is zero", async () => {
    await POST(request(validBody));
    const streamArgs = mocks.streamText.mock.calls[0]?.[0] as {
      onEnd: (event: { totalUsage: unknown }) => Promise<void>;
    };

    await streamArgs.onEnd({ totalUsage: {} });

    expect(mocks.recordAiUsage).toHaveBeenCalledWith({
      organizationId: "org_1",
      userId: "user_1",
      modelId: "anthropic:claude-opus-5",
      totalTokens: 0,
    });
    expect(mocks.logger.warn).toHaveBeenCalledWith(
      "Chat usage recorded zero tokens",
      {
        conversationId: "c1",
        modelId: "anthropic:claude-opus-5",
      }
    );
  });
});
