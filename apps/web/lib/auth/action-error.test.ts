import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const refererRef = { value: "https://app.example.com/en/members" };
vi.mock("next/headers", () => ({
  headers: () =>
    Promise.resolve({
      get: (name: string) =>
        name.toLowerCase() === "referer" ? refererRef.value : null,
    }),
}));

import {
  actionError,
  baErrorMessage,
  formActionError,
  toActionError,
  toFormError,
} from "./action-error";

/** Shape thrown by Better Auth after the @better-auth/i18n plugin translated it. */
function translatedAPIError(message: string, originalMessage: string) {
  return Object.assign(new Error(message), {
    body: { code: "ORGANIZATION_SLUG_ALREADY_TAKEN", message, originalMessage },
  });
}

/** Coded APIError the plugin did NOT translate (no originalMessage stamp). */
function untranslatedAPIError() {
  return Object.assign(new Error("Some raw english message"), {
    body: { code: "MEMBER_NOT_FOUND", message: "Some raw english message" },
  });
}

beforeEach(() => {
  refererRef.value = "https://app.example.com/en/members";
});

describe("toActionError", () => {
  it("surfaces the plugin-translated message", async () => {
    const error = translatedAPIError(
      "Dieser Slug ist bereits vergeben.",
      "This slug is already taken."
    );
    const result = await toActionError(error, { fallback: "unknownError" });
    expect(result).toEqual({
      success: false,
      error: "Dieser Slug ist bereits vergeben.",
      code: "ORGANIZATION_SLUG_ALREADY_TAKEN",
    });
  });

  it("falls back to the localized generic for untranslated APIErrors", async () => {
    const result = await toActionError(untranslatedAPIError(), {
      fallback: "unknownError",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("An error occurred");
      expect(result.code).toBe("MEMBER_NOT_FOUND");
    }
  });

  it("falls back for non-APIError throws", async () => {
    const result = await toActionError(new Error("db exploded"), {
      fallback: "updateProfile",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).not.toContain("db exploded");
      expect(result.code).toBe("updateProfile");
    }
  });

  it("localizes the generic fallback via the request locale", async () => {
    refererRef.value = "https://app.example.com/de/members";
    const result = await toActionError(untranslatedAPIError(), {
      fallback: "unknownError",
    });
    if (!result.success) {
      expect(result.error).toBe("Ein Fehler ist aufgetreten");
    }
  });

  it("returns the first zod issue message", async () => {
    const zodLike = { issues: [{ message: "Invalid email address" }] };
    const result = await toActionError(zodLike, { fallback: "invalidInput" });
    if (!result.success) {
      expect(result.error).toBe("Invalid email address");
      expect(result.code).toBe("invalidInput");
    }
  });
});

describe("baErrorMessage", () => {
  it("returns the translated message when the plugin stamped it", async () => {
    const error = translatedAPIError("El usuario ya es miembro", "User is already a member");
    expect(await baErrorMessage(error, "unknownError")).toBe(
      "El usuario ya es miembro"
    );
  });

  it("returns the localized fallback otherwise", async () => {
    expect(await baErrorMessage(new Error("boom"), "unknownError")).toBe(
      "An error occurred"
    );
  });
});

describe("actionError", () => {
  it("carries its code alongside the localized message", async () => {
    expect(await actionError("unknownError")).toEqual({
      success: false,
      error: "An error occurred",
      code: "unknownError",
    });
  });
});

describe("formActionError", () => {
  it("carries its code alongside the localized message", async () => {
    expect(await formActionError("unknownError")).toEqual({
      status: "error",
      error: "An error occurred",
      code: "unknownError",
    });
  });
});

describe("toFormError", () => {
  it("passes the Better Auth code through", async () => {
    const result = await toFormError(untranslatedAPIError(), {
      fallback: "unknownError",
    });
    expect(result).toEqual({
      status: "error",
      error: "An error occurred",
      code: "MEMBER_NOT_FOUND",
    });
  });
});
