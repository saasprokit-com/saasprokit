import type { createRequestLogger } from "@repo/logger/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  deleteFile: vi.fn(),
  fileCreate: vi.fn(),
  transaction: vi.fn(),
  txFileFindMany: vi.fn(),
  txFileUpdateMany: vi.fn(),
  txOrganizationUpdate: vi.fn(),
  uploadFile: vi.fn(),
}));

vi.mock("@repo/database", () => ({
  database: {
    $transaction: mocks.transaction,
    file: { create: mocks.fileCreate },
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
  mocks.txOrganizationUpdate.mockResolvedValue({ slug: "acme" });
  mocks.txFileFindMany.mockResolvedValue([]);
  mocks.txFileUpdateMany.mockResolvedValue({ count: 0 });
  mocks.deleteFile.mockResolvedValue(undefined);
  mocks.transaction.mockImplementation((run) =>
    run({
      file: {
        findMany: mocks.txFileFindMany,
        updateMany: mocks.txFileUpdateMany,
      },
      organization: { update: mocks.txOrganizationUpdate },
    })
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
    expect(result).toEqual({ publicUrl: "/uploads/logos/logo.png", slug: "acme" });
  });

  it("swaps the organization logo and retires the previous file in one transaction", async () => {
    mocks.txFileFindMany.mockResolvedValue([
      { bucket: null, storagePath: "logos/old.png" },
    ]);

    await storeOrganizationLogo(input);

    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.txOrganizationUpdate).toHaveBeenCalledWith({
      where: { id: "org_1" },
      data: { logo: "/uploads/logos/logo.png" },
      select: { slug: true },
    });
    expect(mocks.txFileUpdateMany).toHaveBeenCalledWith({
      where: {
        attachableType: "Organization",
        attachableId: "org_1",
        id: { not: "file_new" },
        deletedAt: null,
      },
      data: { deletedAt: expect.any(Date) },
    });
    expect(mocks.deleteFile).toHaveBeenCalledWith("logos/old.png", undefined);
    expect(mocks.deleteFile).toHaveBeenCalledAfter(mocks.txFileUpdateMany);
  });

  it("keeps the new logo when a previous object cannot be deleted", async () => {
    mocks.txFileFindMany.mockResolvedValue([
      { bucket: null, storagePath: "logos/old.png" },
    ]);
    mocks.deleteFile.mockRejectedValue(new Error("gone"));

    await expect(storeOrganizationLogo(input)).resolves.toEqual({
      publicUrl: "/uploads/logos/logo.png",
      slug: "acme",
    });
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ storagePath: "logos/old.png" }),
      "Stored object not deleted"
    );
  });
});
