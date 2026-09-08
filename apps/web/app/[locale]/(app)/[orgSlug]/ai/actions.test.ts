import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  actionError: vi.fn(),
  conversationCreate: vi.fn(),
  conversationDeleteMany: vi.fn(),
  conversationFindFirst: vi.fn(),
  generateImage: vi.fn(),
  getAiQuotaStatus: vi.fn(),
  imageModel: vi.fn(),
  isConfigured: vi.fn(),
  isWithinAiQuota: vi.fn(),
  recordAiUsage: vi.fn(),
  revalidateOrgPage: vi.fn(),
  saveMessages: vi.fn(),
  storeGeneratedImage: vi.fn(),
  toActionError: vi.fn(),
  validateOrganizationMembership: vi.fn(),
  verifySession: vi.fn(),
}));

let generatedIds = 0;
vi.mock("ai", () => ({
  generateId: () => `id_${++generatedIds}`,
  generateImage: mocks.generateImage,
}));
vi.mock("@repo/database", () => ({
  database: {
    aiConversation: {
      create: mocks.conversationCreate,
      deleteMany: mocks.conversationDeleteMany,
      findFirst: mocks.conversationFindFirst,
    },
  },
}));
vi.mock("@repo/logger/log", () => ({
  createRequestLogger: () => ({ error: vi.fn() }),
}));
vi.mock("@/lib/ai/actions", () => ({
  recordAiUsage: mocks.recordAiUsage,
  saveMessages: mocks.saveMessages,
  storeGeneratedImage: mocks.storeGeneratedImage,
}));
vi.mock("@/lib/ai/queries", () => ({
  getAiQuotaStatus: mocks.getAiQuotaStatus,
  isWithinAiQuota: mocks.isWithinAiQuota,
}));
vi.mock("@/lib/ai/registry", () => ({
  isConfigured: mocks.isConfigured,
  registry: { imageModel: mocks.imageModel },
}));
vi.mock("@/lib/env", () => ({ env: { AI_MOCK: undefined } }));
vi.mock("@/lib/auth/action-auth", () => ({
  verifySession: mocks.verifySession,
}));
vi.mock("@/lib/auth/action-error", () => ({
  actionError: mocks.actionError,
  toActionError: mocks.toActionError,
}));
vi.mock("@/lib/infrastructure/revalidation", () => ({
  revalidateOrgPage: mocks.revalidateOrgPage,
}));
vi.mock("@/lib/organization/queries", () => ({
  validateOrganizationMembership: mocks.validateOrganizationMembership,
}));

import { IMAGE_MODEL } from "@/lib/ai/models";
import { ORG_PAGES } from "@/lib/routes";
import {
  createConversationAction,
  deleteConversationAction,
  generateImageAction,
} from "./actions";

const session = { user: { id: "user_1" } };
const scope = { organizationId: "org_1", orgSlug: "acme" };

beforeEach(() => {
  vi.clearAllMocks();
  generatedIds = 0;
  mocks.verifySession.mockResolvedValue({ session, error: null });
  mocks.validateOrganizationMembership.mockResolvedValue(true);
  mocks.actionError.mockImplementation(async (code: string) => ({
    success: false,
    status: "error",
    code,
    error: code,
  }));
  mocks.toActionError.mockImplementation(
    async (_e: unknown, { fallback }: { fallback: string }) => ({
      success: false,
      status: "error",
      code: fallback,
      error: fallback,
    })
  );
  mocks.isConfigured.mockReturnValue(true);
  mocks.getAiQuotaStatus.mockResolvedValue({ usage: {}, limits: {} });
  mocks.isWithinAiQuota.mockReturnValue(true);
  mocks.imageModel.mockReturnValue("image-model");
  mocks.generateImage.mockResolvedValue({
    image: {
      mediaType: "image/png",
      uint8Array: new Uint8Array([1]),
      base64: "AQ==",
    },
  });
  mocks.storeGeneratedImage.mockResolvedValue({
    url: "/uploads/ai-images/c1-1.png",
    mediaType: "image/png",
    filename: "c1-1.png",
  });
  mocks.conversationFindFirst.mockResolvedValue({ id: "c1" });
  mocks.revalidateOrgPage.mockResolvedValue(undefined);
});

describe("createConversationAction", () => {
  it("rejects anonymous callers", async () => {
    mocks.verifySession.mockResolvedValue({
      session: null,
      error: { success: false, error: "Unauthorized" },
    });
    expect(await createConversationAction(scope)).toEqual({
      success: false,
      error: "Unauthorized",
    });
    expect(mocks.conversationCreate).not.toHaveBeenCalled();
  });

  it("rejects non-members", async () => {
    mocks.validateOrganizationMembership.mockResolvedValue(false);
    const result = await createConversationAction(scope);
    expect(result.success).toBe(false);
    expect(mocks.conversationCreate).not.toHaveBeenCalled();
  });

  it("creates a conversation owned by the session user and revalidates the AI page", async () => {
    mocks.conversationCreate.mockResolvedValue({ id: "c_new" });
    const result = await createConversationAction(scope);
    expect(mocks.conversationCreate).toHaveBeenCalledWith({
      data: { organizationId: "org_1", userId: "user_1" },
      select: { id: true },
    });
    expect(mocks.revalidateOrgPage).toHaveBeenCalledWith(
      "acme",
      ORG_PAGES.AI
    );
    expect(result).toEqual({ success: true, data: { id: "c_new" } });
  });
});

describe("deleteConversationAction", () => {
  const input = { ...scope, conversationId: "c1" };

  it("deletes only a conversation owned by the caller inside the org", async () => {
    mocks.conversationDeleteMany.mockResolvedValue({ count: 1 });
    const result = await deleteConversationAction(input, null, new FormData());
    expect(mocks.conversationDeleteMany).toHaveBeenCalledWith({
      where: { id: "c1", organizationId: "org_1", userId: "user_1" },
    });
    expect(result).toEqual({ success: true });
  });

  it("rejects callers who are no longer members", async () => {
    mocks.validateOrganizationMembership.mockResolvedValue(false);
    const result = await deleteConversationAction(input, null, new FormData());
    expect(result.success).toBe(false);
    expect(mocks.conversationDeleteMany).not.toHaveBeenCalled();
  });

  it("returns notFound when nothing was deleted", async () => {
    mocks.conversationDeleteMany.mockResolvedValue({ count: 0 });
    const result = await deleteConversationAction(input, null, new FormData());
    expect(result.success).toBe(false);
    expect(mocks.actionError).toHaveBeenCalledWith("notFound");
  });
});

describe("generateImageAction", () => {
  const input = { ...scope, conversationId: "c1", prompt: "a red panda" };

  it("rejects invalid input before touching auth", async () => {
    const result = await generateImageAction({ ...input, prompt: "" });
    expect(result.success).toBe(false);
    expect(mocks.verifySession).not.toHaveBeenCalled();
  });

  it("rejects when the image quota is exhausted", async () => {
    mocks.isWithinAiQuota.mockReturnValue(false);
    const result = await generateImageAction(input);
    expect(result.success).toBe(false);
    expect(mocks.actionError).toHaveBeenCalledWith("aiQuotaExceeded");
    expect(mocks.generateImage).not.toHaveBeenCalled();
  });

  it("rejects when the image provider is not configured", async () => {
    mocks.isConfigured.mockReturnValue(false);
    const result = await generateImageAction(input);
    expect(result.success).toBe(false);
    expect(mocks.isConfigured).toHaveBeenCalledWith(IMAGE_MODEL);
    expect(mocks.actionError).toHaveBeenCalledWith("invalidInput");
  });

  it("rejects a conversation the caller does not own", async () => {
    mocks.conversationFindFirst.mockResolvedValue(null);
    const result = await generateImageAction(input);
    expect(result.success).toBe(false);
    expect(mocks.actionError).toHaveBeenCalledWith("notFound");
  });

  it("generates, stores, persists both messages, records usage and returns them", async () => {
    const result = await generateImageAction(input);
    expect(mocks.imageModel).toHaveBeenCalledWith(IMAGE_MODEL);
    expect(mocks.generateImage).toHaveBeenCalledWith({
      model: "image-model",
      prompt: "a red panda",
      size: "1024x1024",
    });
    expect(mocks.storeGeneratedImage).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_1",
        uploadedById: "user_1",
        conversationId: "c1",
      })
    );
    const messages = [
      {
        id: "id_1",
        role: "user",
        parts: [{ type: "text", text: "a red panda" }],
      },
      {
        id: "id_2",
        role: "assistant",
        parts: [
          {
            type: "file",
            mediaType: "image/png",
            url: "/uploads/ai-images/c1-1.png",
            filename: "c1-1.png",
          },
        ],
      },
    ];
    expect(mocks.saveMessages).toHaveBeenCalledWith("c1", messages);
    expect(mocks.recordAiUsage).toHaveBeenCalledWith({
      organizationId: "org_1",
      userId: "user_1",
      modelId: IMAGE_MODEL,
      imageCount: 1,
    });
    expect(mocks.revalidateOrgPage).toHaveBeenCalledWith(
      "acme",
      ORG_PAGES.AI
    );
    expect(result).toEqual({ success: true, data: { messages } });
  });

  it("maps provider failures through toActionError", async () => {
    mocks.generateImage.mockRejectedValue(new Error("boom"));
    const result = await generateImageAction(input);
    expect(result).toEqual({
      success: false,
      status: "error",
      code: "generateImage",
      error: "generateImage",
    });
  });
});
