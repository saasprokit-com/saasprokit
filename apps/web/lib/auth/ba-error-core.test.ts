import { describe, expect, it } from "vitest";
import type { BAErrorMessages } from "./ba-error-core";
import { extractBAErrorCode, translateBAError } from "./ba-error-core";

const messages = {
  USER_NOT_FOUND: "Utilisateur introuvable",
  INVITATION_NOT_FOUND: "Invitation introuvable",
} as BAErrorMessages;

describe("extractBAErrorCode", () => {
  it("reads body.code from a server APIError shape", () => {
    const error = { body: { code: "USER_NOT_FOUND", message: "User not found" } };
    expect(extractBAErrorCode(error)).toBe("USER_NOT_FOUND");
  });

  it("reads a flat code from an authClient result.error shape", () => {
    const error = { code: "INVITATION_NOT_FOUND", message: "x", status: 404 };
    expect(extractBAErrorCode(error)).toBe("INVITATION_NOT_FOUND");
  });

  it("prefers body.code over a flat code", () => {
    const error = { code: "OUTER", body: { code: "INNER" } };
    expect(extractBAErrorCode(error)).toBe("INNER");
  });

  it("returns null for plain Errors", () => {
    expect(extractBAErrorCode(new Error("User not found"))).toBeNull();
  });

  it("returns null for null, undefined, and primitives", () => {
    expect(extractBAErrorCode(null)).toBeNull();
    expect(extractBAErrorCode(undefined)).toBeNull();
    expect(extractBAErrorCode("USER_NOT_FOUND")).toBeNull();
  });

  it("returns null when code is not a string", () => {
    expect(extractBAErrorCode({ code: 42 })).toBeNull();
    expect(extractBAErrorCode({ body: { code: 42 } })).toBeNull();
  });
});

describe("translateBAError", () => {
  it("returns the translation for a known code", () => {
    const error = { body: { code: "USER_NOT_FOUND" } };
    expect(translateBAError(messages, error)).toBe("Utilisateur introuvable");
  });

  it("translates client-shaped errors", () => {
    const error = { code: "INVITATION_NOT_FOUND" };
    expect(translateBAError(messages, error)).toBe("Invitation introuvable");
  });

  it("returns null for unknown codes", () => {
    const error = { body: { code: "NOT_A_REAL_CODE" } };
    expect(translateBAError(messages, error)).toBeNull();
  });

  it("returns null for errors without a code", () => {
    expect(translateBAError(messages, new Error("boom"))).toBeNull();
    expect(translateBAError(messages, null)).toBeNull();
  });
});

describe("translateBAError hardening", () => {
  it("does not match prototype-chain keys like toString", () => {
    expect(translateBAError(messages, { code: "toString" })).toBeNull();
    expect(translateBAError(messages, { code: "constructor" })).toBeNull();
  });
});
