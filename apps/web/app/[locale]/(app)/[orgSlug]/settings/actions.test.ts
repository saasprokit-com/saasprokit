import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  actionError: vi.fn(),
  fileUpdateMany: vi.fn(),
  hasOrgPermission: vi.fn(),
  headers: vi.fn(),
  organizationFindUnique: vi.fn(),
  organizationUpdate: vi.fn(),
  revalidateOrgPage: vi.fn(),
  toActionError: vi.fn(),
  transaction: vi.fn(),
  updateOrganization: vi.fn(),
}));

vi.mock("@repo/auth/server", () => ({
  auth: { api: { updateOrganization: mocks.updateOrganization } },
}));

vi.mock("@repo/database", () => ({
  database: {
    $transaction: mocks.transaction,
    file: { updateMany: mocks.fileUpdateMany },
    organization: {
      findUnique: mocks.organizationFindUnique,
      update: mocks.organizationUpdate,
    },
  },
}));

vi.mock("@repo/logger/server", () => ({
  createRequestLogger: () => ({ error: vi.fn() }),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));

vi.mock("@/lib/auth/action-error", () => ({
  actionError: mocks.actionError,
  toActionError: mocks.toActionError,
}));

vi.mock("@/lib/auth/auth", () => ({
  hasOrgPermission: mocks.hasOrgPermission,
}));

vi.mock("@/lib/infrastructure/revalidation", () => ({
  revalidateOrgPage: mocks.revalidateOrgPage,
}));

import { ORG_PAGES } from "@/lib/routes";
import {
  removeOrganizationLogoAction,
  updateOrganizationAction,
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
    mocks.transaction.mockResolvedValue([{ count: 1 }, { slug: "acme" }]);

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
});
