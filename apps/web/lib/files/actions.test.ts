import type { createRequestLogger } from "@repo/logger/log";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  deleteFile: vi.fn(),
  fileCreate: vi.fn(),
  fileFindMany: vi.fn(),
  fileUpdateMany: vi.fn(),
  organizationUpdate: vi.fn(),
  transaction: vi.fn(),
  uploadFile: vi.fn(),
}));

vi.mock("@repo/database", () => ({
  database: {
    $transaction: mocks.transaction,
    file: {
      create: mocks.fileCreate,
      findMany: mocks.fileFindMany,
      updateMany: mocks.fileUpdateMany,
    },
    organization: { update: mocks.organizationUpdate },
  },
}));

vi.mock("@repo/storage/server", () => ({
  deleteFile: mocks.deleteFile,
  uploadFile: mocks.uploadFile,
}));

import { storeOrganizationLogo } from "./actions";

const warn = vi.fn();
const logger = { warn } as unknown as ReturnType<typeof createRequestLogger>;

const file = new File([new Uint8Array(10)], "logo.png", { type: "image/png" });

const uploadResult = {
  bucket: null,
  filename: "logo.png",
  mimeType: "image/png",
  provider: "local",
  publicUrl: "/uploads/logos/logo.png",
  size: 10,
  storagePath: "logos/logo.png",
  visibility: "public",
};

const input = {
  file,
  organizationId: "org_1",
  uploadedById: "user_1",
  logger,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.uploadFile.mockResolvedValue(uploadResult);
  mocks.fileCreate.mockResolvedValue({ id: "file_new" });
  mocks.organizationUpdate.mockResolvedValue({ slug: "acme" });
  mocks.fileFindMany.mockResolvedValue([]);
  mocks.fileUpdateMany.mockResolvedValue({ count: 0 });
  mocks.deleteFile.mockResolvedValue(undefined);
  mocks.transaction.mockImplementation((operations: unknown[]) =>
    Promise.all(operations)
  );
});

describe("storeOrganizationLogo", () => {
  it("uploads under logos/ attached to the organization and records the file", async () => {
    const result = await storeOrganizationLogo(input);

    expect(mocks.uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: "logo.png",
        mimeType: "image/png",
        folder: "logos",
        attachableType: "Organization",
        attachableId: "org_1",
        uploadedById: "user_1",
      })
    );
    expect(mocks.fileCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        storagePath: "logos/logo.png",
        publicUrl: "/uploads/logos/logo.png",
        attachableType: "Organization",
        attachableId: "org_1",
        uploadedById: "user_1",
      }),
      select: { id: true },
    });
    expect(result).toEqual({
      publicUrl: "/uploads/logos/logo.png",
      slug: "acme",
    });
  });

  it("swaps the organization logo and retires the previous file in one batched transaction", async () => {
    mocks.fileFindMany.mockResolvedValue([
      { bucket: null, storagePath: "logos/old.png" },
    ]);

    await storeOrganizationLogo(input);

    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.organizationUpdate).toHaveBeenCalledWith({
      where: { id: "org_1" },
      data: { logo: "/uploads/logos/logo.png" },
      select: { slug: true },
    });
    expect(mocks.fileUpdateMany).toHaveBeenCalledWith({
      where: {
        attachableType: "Organization",
        attachableId: "org_1",
        id: { not: "file_new" },
        deletedAt: null,
      },
      data: { deletedAt: expect.any(Date) },
    });
    expect(mocks.deleteFile).toHaveBeenCalledWith("logos/old.png", undefined);
    expect(mocks.deleteFile).toHaveBeenCalledAfter(mocks.transaction);
  });

  it("keeps the new logo when a previous object cannot be deleted", async () => {
    mocks.fileFindMany.mockResolvedValue([
      { bucket: null, storagePath: "logos/old.png" },
    ]);
    mocks.deleteFile.mockRejectedValue(new Error("gone"));

    await expect(storeOrganizationLogo(input)).resolves.toEqual({
      publicUrl: "/uploads/logos/logo.png",
      slug: "acme",
    });
    expect(warn).toHaveBeenCalledWith(
      "Stored object not deleted",
      expect.objectContaining({ storagePath: "logos/old.png" })
    );
  });

  it("leaves the previous object in place when the transaction fails", async () => {
    mocks.fileFindMany.mockResolvedValue([
      { bucket: null, storagePath: "logos/old.png" },
    ]);
    mocks.transaction.mockRejectedValue(new Error("db down"));

    await expect(storeOrganizationLogo(input)).rejects.toThrow("db down");
    expect(mocks.deleteFile).not.toHaveBeenCalled();
  });
});
