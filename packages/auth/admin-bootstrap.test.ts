import { describe, expect, it } from "vitest";
import { isBootstrapAdminEmail } from "./admin-bootstrap";

describe("isBootstrapAdminEmail", () => {
  it("matches an exact email", () => {
    expect(isBootstrapAdminEmail("owner@acme.com", "owner@acme.com")).toBe(
      true
    );
  });

  it("matches case-insensitively", () => {
    expect(isBootstrapAdminEmail("Owner@Acme.com", "owner@acme.com")).toBe(
      true
    );
    expect(isBootstrapAdminEmail("owner@acme.com", "OWNER@ACME.COM")).toBe(
      true
    );
  });

  it("matches any entry in a CSV list with surrounding spaces", () => {
    const csv = " first@acme.com , second@acme.com ,third@acme.com";
    expect(isBootstrapAdminEmail("second@acme.com", csv)).toBe(true);
    expect(isBootstrapAdminEmail("third@acme.com", csv)).toBe(true);
  });

  it("rejects an email not in the list", () => {
    expect(
      isBootstrapAdminEmail("intruder@acme.com", "owner@acme.com")
    ).toBe(false);
  });

  it("rejects partial matches", () => {
    expect(isBootstrapAdminEmail("owner@acme.co", "owner@acme.com")).toBe(
      false
    );
  });

  it("returns false when the list is undefined or empty", () => {
    expect(isBootstrapAdminEmail("owner@acme.com", undefined)).toBe(false);
    expect(isBootstrapAdminEmail("owner@acme.com", "")).toBe(false);
    expect(isBootstrapAdminEmail("owner@acme.com", " , ,")).toBe(false);
  });

  it("never matches an empty email, even against a sloppy CSV", () => {
    expect(isBootstrapAdminEmail("", "owner@acme.com,,")).toBe(false);
  });
});
