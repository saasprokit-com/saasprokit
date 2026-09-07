import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  conversationUpdate: vi.fn(),
  messageCreateMany: vi.fn(),
  transaction: vi.fn(),
  uploadFile: vi.fn(),
}));

vi.mock("@repo/database", () => ({
  database: {
    $transaction: mocks.transaction,
    aiConversation: { update: mocks.conversationUpdate },
    aiMessage: { createMany: mocks.messageCreateMany },
  },
}));
vi.mock("@repo/storage/server", () => ({ uploadFile: mocks.uploadFile }));

import { saveMessages, storeGeneratedImage } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.transaction.mockResolvedValue([]);
});

describe("saveMessages", () => {
  it("inserts the messages and bumps the conversation in one transaction, ignoring duplicate ids", async () => {
    mocks.messageCreateMany.mockReturnValue("createMany");
    mocks.conversationUpdate.mockReturnValue("update");
    await saveMessages("c1", [
      { id: "m1", role: "user", parts: [{ type: "text", text: "hi" }] },
      { id: "m2", role: "assistant", parts: [{ type: "text", text: "hello" }] },
    ]);
    expect(mocks.messageCreateMany).toHaveBeenCalledWith({
      data: [
        { id: "m1", conversationId: "c1", role: "user", parts: JSON.stringify([{ type: "text", text: "hi" }]) },
        { id: "m2", conversationId: "c1", role: "assistant", parts: JSON.stringify([{ type: "text", text: "hello" }]) },
      ],
      skipDuplicates: true,
    });
    expect(mocks.conversationUpdate).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { updatedAt: expect.any(Date) },
    });
    expect(mocks.transaction).toHaveBeenCalledWith(["createMany", "update"]);
  });
});

describe("storeGeneratedImage", () => {
  const image = { base64: "AAAA", uint8Array: new Uint8Array([1, 2, 3]), mediaType: "image/png" };
  const options = { image, organizationId: "org_1", uploadedById: "user_1", conversationId: "c1" };

  it("uploads the bytes under the conversation id and returns the public url", async () => {
    mocks.uploadFile.mockResolvedValue({
      bucket: null,
      filename: "c1-1757000000000-abc123.png",
      mimeType: "image/png",
      provider: "local",
      publicUrl: "/uploads/ai-images/c1-1757000000000-abc123.png",
      size: 3,
      storagePath: "ai-images/c1-1757000000000-abc123.png",
      visibility: "public",
    });
    const result = await storeGeneratedImage(options);
    expect(mocks.uploadFile).toHaveBeenCalledWith({
      filename: "c1",
      buffer: Buffer.from([1, 2, 3]),
      mimeType: "image/png",
      folder: "ai-images",
      uploadedById: "user_1",
      attachableType: "Organization",
      attachableId: "org_1",
    });
    expect(result).toEqual({
      url: "/uploads/ai-images/c1-1757000000000-abc123.png",
      mediaType: "image/png",
      filename: "c1-1757000000000-abc123.png",
    });
  });

  it("throws when the provider returns no public url", async () => {
    mocks.uploadFile.mockResolvedValue({
      bucket: "b",
      filename: "x.png",
      mimeType: "image/png",
      provider: "s3",
      publicUrl: null,
      size: 3,
      storagePath: "ai-images/x.png",
      visibility: "private",
    });
    await expect(storeGeneratedImage(options)).rejects.toThrow("Generated image has no public URL");
  });
});
