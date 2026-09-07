import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  actionError: vi.fn(),
  deleteOrganization: vi.fn(),
  deleteStoredObjects: vi.fn(),
  fileFindMany: vi.fn(),
  fileUpdateMany: vi.fn(),
  hasOrgPermission: vi.fn(),
  headers: vi.fn(),
  organizationFindUnique: vi.fn(),
  organizationUpdate: vi.fn(),
  revalidateOrgPage: vi.fn(),
  storeOrganizationLogo: vi.fn(),
  toActionError: vi.fn(),
  transaction: vi.fn(),
  updateOrganization: vi.fn(),
  validateStorageQuota: vi.fn(),
  verifySession: vi.fn(),
}));

vi.mock("@repo/auth/server", () => ({
  auth: {
    api: {
      deleteOrganization: mocks.deleteOrganization,
      updateOrganization: mocks.updateOrganization,
    },
  },
}));


vi.mock("@repo/database", () => ({
  database: {
    $transaction: mocks.transaction,
    file: { findMany: mocks.fileFindMany, updateMany: mocks.fileUpdateMany },
    organization: {
      findUnique: mocks.organizationFindUnique,
      update: mocks.organizationUpdate,
    },
  },
}));

vi.mock("@repo/logger/log", () => ({
  createRequestLogger: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));

vi.mock("@/lib/auth/action-auth", () => ({
  verifySession: mocks.verifySession,
}));

vi.mock("@/lib/auth/action-error", () => ({
  actionError: mocks.actionError,
  toActionError: mocks.toActionError,
}));

vi.mock("@/lib/auth/auth", () => ({
  hasOrgPermission: mocks.hasOrgPermission,
}));

vi.mock("@/lib/files/actions", () => ({
  deleteStoredObjects: mocks.deleteStoredObjects,
  storeOrganizationLogo: mocks.storeOrganizationLogo,
}));

vi.mock("@/lib/files/storage-quota", () => ({
  validateStorageQuota: mocks.validateStorageQuota,
}));

vi.mock("@/lib/infrastructure/revalidation", () => ({
  revalidateOrgPage: mocks.revalidateOrgPage,
}));

import { MAX_FILE_SIZE } from "@repo/utils/storage";
import { ORG_PAGES } from "@/lib/routes";
import {
  deleteOrganizationAction,
  removeOrganizationLogoAction,
  updateOrganizationAction,
  uploadOrganizationLogoAction,
} from "./actions";

const requestHeaders = new Headers({ cookie: "session=test" });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.headers.mockResolvedValue(requestHeaders);
  mocks.actionError.mockImplementation(async (code: string) => ({
    code,
    error: code,
    status: "error",
    success: false,
  }));
  mocks.toActionError.mockImplementation(
    async (_error: unknown, { fallback }: { fallback: string }) => ({
      code: fallback,
      error: fallback,
      status: "error",
      success: false,
    })
  );
  mocks.hasOrgPermission.mockResolvedValue(true);
  mocks.revalidateOrgPage.mockResolvedValue(undefined);
  mocks.fileFindMany.mockResolvedValue([]);
  mocks.deleteStoredObjects.mockResolvedValue(undefined);
  mocks.verifySession.mockResolvedValue({
    session: { user: { id: "user_1" } },
    error: null,
  });
  mocks.validateStorageQuota.mockResolvedValue({ valid: true });
  mocks.storeOrganizationLogo.mockResolvedValue({
    publicUrl: null,
    slug: "acme",
  });
});

describe("updateOrganizationAction", () => {
  const input = { name: "Acme Renamed", organizationId: "org_1" };

  it("lets Better Auth authorize before any organization read", async () => {
    mocks.updateOrganization.mockResolvedValue({ id: "org_1", slug: "acme" });

    const result = await updateOrganizationAction({ status: "idle" }, input);

    expect(mocks.organizationFindUnique).not.toHaveBeenCalled();
    expect(mocks.updateOrganization).toHaveBeenCalledWith({
      headers: requestHeaders,
      body: { data: { name: "Acme Renamed" }, organizationId: "org_1" },
    });
    expect(mocks.revalidateOrgPage).toHaveBeenCalledWith(
      "acme",
      ORG_PAGES.SETTINGS
    );
    expect(result).toEqual({ status: "success" });
  });

  it("maps a null Better Auth result to orgNotFound", async () => {
    mocks.updateOrganization.mockResolvedValue(null);

    const result = await updateOrganizationAction({ status: "idle" }, input);

    expect(mocks.revalidateOrgPage).not.toHaveBeenCalled();
    expect(result).toMatchObject({ code: "orgNotFound" });
  });

});

describe("removeOrganizationLogoAction", () => {
  it("takes the slug from the transaction result instead of a pre-read", async () => {
    mocks.transaction.mockResolvedValue([[], { count: 1 }, { slug: "acme" }]);

    const result = await removeOrganizationLogoAction({
      organizationId: "org_1",
    });

    expect(mocks.hasOrgPermission).toHaveBeenCalledWith("org_1", {
      organization: ["update"],
    });
    expect(mocks.organizationFindUnique).not.toHaveBeenCalled();
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.revalidateOrgPage).toHaveBeenCalledWith(
      "acme",
      ORG_PAGES.SETTINGS
    );
    expect(result).toEqual({ success: true });
  });

  it("reads the rows to delete inside the same transaction that retires them", async () => {
    mocks.transaction.mockResolvedValue([[], { count: 1 }, { slug: "acme" }]);

    await removeOrganizationLogoAction({ organizationId: "org_1" });

    expect(mocks.transaction.mock.calls[0][0]).toHaveLength(3);
    expect(mocks.fileFindMany).toHaveBeenCalledWith({
      where: {
        attachableType: "Organization",
        attachableId: "org_1",
        deletedAt: null,
      },
      select: { storagePath: true, bucket: true },
    });
  });

  it("deletes the replaced logo objects only after the transaction commits", async () => {
    const replaced = [{ bucket: null, storagePath: "logos/old.png" }];
    mocks.transaction.mockResolvedValue([
      replaced,
      { count: 1 },
      { slug: "acme" },
    ]);

    await removeOrganizationLogoAction({ organizationId: "org_1" });

    expect(mocks.deleteStoredObjects).toHaveBeenCalledWith(
      replaced,
      expect.anything()
    );
    expect(mocks.deleteStoredObjects).toHaveBeenCalledAfter(mocks.transaction);
  });

  it("skips object deletion when the transaction throws", async () => {
    mocks.transaction.mockRejectedValue(new Error("db down"));

    await removeOrganizationLogoAction({ organizationId: "org_1" });

    expect(mocks.deleteStoredObjects).not.toHaveBeenCalled();
  });
});

describe("uploadOrganizationLogoAction", () => {
  const png = new File([new Uint8Array(10)], "logo.png", {
    type: "image/png",
  });

  function formDataWith(file: File | string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("organizationId", "org_1");
    return formData;
  }

  it("rejects anonymous callers before touching the file", async () => {
    const unauthorized = {
      code: "unauthorized",
      error: "unauthorized",
      status: "error",
      success: false,
    };
    mocks.verifySession.mockResolvedValue({ session: null, error: unauthorized });

    const result = await uploadOrganizationLogoAction(formDataWith(png));

    expect(result).toBe(unauthorized);
    expect(mocks.hasOrgPermission).not.toHaveBeenCalled();
    expect(mocks.storeOrganizationLogo).not.toHaveBeenCalled();
  });

  it("rejects a non-image with the schema's message", async () => {
    const result = await uploadOrganizationLogoAction(formDataWith("not a file"));

    expect(mocks.toActionError).toHaveBeenCalledWith(
      expect.objectContaining({ issues: expect.any(Array) }),
      { fallback: "uploadLogo", logger: expect.anything() }
    );
    expect(result).toMatchObject({ success: false });
    expect(mocks.hasOrgPermission).not.toHaveBeenCalled();
  });

  it("rejects a disallowed image type before any permission check", async () => {
    const svg = new File(["<svg />"], "logo.svg", { type: "image/svg+xml" });

    const result = await uploadOrganizationLogoAction(formDataWith(svg));

    expect(mocks.toActionError).toHaveBeenCalledWith(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({ path: ["type"] }),
        ]),
      }),
      { fallback: "uploadLogo", logger: expect.anything() }
    );
    expect(result).toMatchObject({ success: false });
    expect(mocks.hasOrgPermission).not.toHaveBeenCalled();
    expect(mocks.storeOrganizationLogo).not.toHaveBeenCalled();
  });

  it("rejects a file over the size cap before any permission check", async () => {
    const tooBig = new File(
      [new Uint8Array(MAX_FILE_SIZE + 1)],
      "logo.png",
      { type: "image/png" }
    );

    const result = await uploadOrganizationLogoAction(formDataWith(tooBig));

    expect(mocks.toActionError).toHaveBeenCalledWith(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({ path: ["size"] }),
        ]),
      }),
      { fallback: "uploadLogo", logger: expect.anything() }
    );
    expect(result).toMatchObject({ success: false });
    expect(mocks.hasOrgPermission).not.toHaveBeenCalled();
    expect(mocks.storeOrganizationLogo).not.toHaveBeenCalled();
  });

  it("refuses members without organization:update", async () => {
    mocks.hasOrgPermission.mockResolvedValue(false);

    const result = await uploadOrganizationLogoAction(formDataWith(png));

    expect(mocks.hasOrgPermission).toHaveBeenCalledWith("org_1", {
      organization: ["update"],
    });
    expect(result).toMatchObject({ success: false, code: "unauthorized" });
    expect(mocks.validateStorageQuota).not.toHaveBeenCalled();
  });

  it("returns the quota message without storing anything", async () => {
    mocks.validateStorageQuota.mockResolvedValue({
      valid: false,
      error: "Storage quota exceeded.",
    });

    const result = await uploadOrganizationLogoAction(formDataWith(png));

    expect(mocks.validateStorageQuota).toHaveBeenCalledWith(
      "org_1",
      10,
      expect.anything()
    );
    expect(result).toEqual({
      success: false,
      error: "Storage quota exceeded.",
      code: "storageQuota",
    });
    expect(mocks.storeOrganizationLogo).not.toHaveBeenCalled();
  });

  it("stores the logo as the session user and revalidates settings", async () => {
    mocks.storeOrganizationLogo.mockResolvedValue({
      publicUrl: "/uploads/logos/logo.png",
      slug: "acme",
    });

    const result = await uploadOrganizationLogoAction(formDataWith(png));

    expect(mocks.storeOrganizationLogo).toHaveBeenCalledWith({
      file: expect.any(File),
      organizationId: "org_1",
      uploadedById: "user_1",
      logger: expect.anything(),
    });
    expect(mocks.revalidateOrgPage).toHaveBeenCalledWith(
      "acme",
      ORG_PAGES.SETTINGS
    );
    expect(result).toEqual({
      success: true,
      data: { publicUrl: "/uploads/logos/logo.png" },
    });
  });
});
