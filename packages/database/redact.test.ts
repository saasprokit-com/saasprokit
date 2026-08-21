import { describe, expect, it } from "vitest";

import { argShape } from "./redact";

const LEAKED_TOKEN = "pD8to3iN7swKCT28HJfzFrpdbcRPPLXm";

describe("argShape", () => {
  it("strips the session token from the args that leaked in production", () => {
    const args = { where: { token: { in: [LEAKED_TOKEN] } } };

    expect(argShape(args)).toEqual({
      where: { token: { in: ["string"] } },
    });
    expect(JSON.stringify(argShape(args))).not.toContain(LEAKED_TOKEN);
  });

  it("strips password reset tokens and email OTPs from Verification lookups", () => {
    const args = {
      where: {
        identifier: "reset-password:usr_123",
        value: "8f3c1e2a-9b47-4d61-8e02-77aa61c9d4f5",
      },
    };

    expect(argShape(args)).toEqual({
      where: { identifier: "string", value: "string" },
    });
  });

  it("strips OAuth tokens and password hashes from Account writes", () => {
    const args = {
      where: { id: "acc_1" },
      data: {
        accessToken: "ya29.a0AfB_byC",
        refreshToken: "1//04xQm",
        idToken: "eyJhbGciOiJSUzI1NiJ9",
        password: "$2b$10$abcdefghijklmnopqrstuv",
      },
    };

    const shape = argShape(args) as { data: Record<string, unknown> };

    expect(shape.data).toEqual({
      accessToken: "string",
      refreshToken: "string",
      idToken: "string",
      password: "string",
    });
    expect(JSON.stringify(shape)).not.toContain("ya29");
  });

  it("strips 2FA secrets and backup codes", () => {
    const args = {
      data: { secret: "JBSWY3DPEHPK3PXP", backupCodes: "a1b2c3,d4e5f6" },
    };

    expect(argShape(args)).toEqual({
      data: { secret: "string", backupCodes: "string" },
    });
  });

  it("strips email addresses from User writes", () => {
    const args = { data: { email: "someone@example.com", emailVerified: true } };

    expect(argShape(args)).toEqual({
      data: { email: "string", emailVerified: "boolean" },
    });
  });

  it("preserves field names and operators so the query shape stays diagnosable", () => {
    const args = {
      where: {
        AND: [{ organizationId: { equals: "org_1" } }, { name: "acme" }],
        email: { contains: "@example.com" },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    };

    expect(argShape(args)).toEqual({
      where: {
        AND: [{ organizationId: { equals: "string" } }],
        email: { contains: "string" },
      },
      orderBy: { createdAt: "string" },
      take: "number",
    });
  });

  it("handles dates, bigints, bytes, null, undefined and empty arrays", () => {
    const args = {
      where: {
        createdAt: { gte: new Date("2026-01-01") },
        counter: 10n,
        avatar: new Uint8Array([1, 2, 3]),
        deletedAt: null,
        cursor: undefined,
        ids: [],
      },
    };

    expect(argShape(args)).toEqual({
      where: {
        createdAt: { gte: "Date" },
        counter: "bigint",
        avatar: "bytes",
        deletedAt: null,
        cursor: "undefined",
        ids: [],
      },
    });
  });

  it("stays JSON-serializable for args that would crash a raw stringify", () => {
    const args = { where: { counter: 10n } };

    expect(() => JSON.stringify(args)).toThrow();
    expect(() => JSON.stringify(argShape(args))).not.toThrow();
  });

  it("caps depth on deeply nested includes", () => {
    const args = {
      a: { b: { c: { d: { e: { f: { g: { h: { i: "secret" } } } } } } } },
    };

    expect(argShape(args)).toEqual({
      a: { b: { c: { d: { e: { f: { g: { h: "…" } } } } } } },
    });
    expect(JSON.stringify(argShape(args))).not.toContain("secret");
  });

  it("collapses arrays to a single representative element", () => {
    const args = { where: { token: { in: ["one", "two", "three"] } } };

    expect(argShape(args)).toEqual({ where: { token: { in: ["string"] } } });
  });
});
