import { describe, expect, it } from "vitest";
import {
  ADMIN_ROLES,
  ORG_ROLES,
  canAdmin,
  canOrg,
  isAdminAreaRole,
  orgAdminRole,
  orgMemberRole,
  orgOwnerRole,
} from "./permissions";

describe("Organization team permissions", () => {
  // Teams are the one org resource canOrg's tests below don't exercise, so
  // these role-level checks are kept as real coverage (not canOrg duplication).
  it("owner should be able to create, update, and delete teams", () => {
    expect(orgOwnerRole.authorize({ team: ["create"] }).success).toBe(true);
    expect(orgOwnerRole.authorize({ team: ["update"] }).success).toBe(true);
    expect(orgOwnerRole.authorize({ team: ["delete"] }).success).toBe(true);
  });

  it("admin should be able to create, update, and delete teams", () => {
    expect(orgAdminRole.authorize({ team: ["create"] }).success).toBe(true);
    expect(orgAdminRole.authorize({ team: ["update"] }).success).toBe(true);
    expect(orgAdminRole.authorize({ team: ["delete"] }).success).toBe(true);
  });

  it("member should not be able to manage teams", () => {
    expect(orgMemberRole.authorize({ team: ["create"] }).success).toBe(false);
    expect(orgMemberRole.authorize({ team: ["update"] }).success).toBe(false);
    expect(orgMemberRole.authorize({ team: ["delete"] }).success).toBe(false);
  });
});

describe("canOrg", () => {
  // { organization: ["update"] } is the exact map gating the Billing sidebar link
  // and the org settings form. A regression here is a privilege escalation.
  it("should gate organization:update to owner and admin only", () => {
    const permissions = { organization: ["update"] };
    expect(canOrg(ORG_ROLES.OWNER, permissions)).toBe(true);
    expect(canOrg(ORG_ROLES.ADMIN, permissions)).toBe(true);
    expect(canOrg(ORG_ROLES.MEMBER, permissions)).toBe(false);
  });

  it("should allow only the owner to delete the organization", () => {
    const permissions = { organization: ["delete"] };
    expect(canOrg(ORG_ROLES.OWNER, permissions)).toBe(true);
    expect(canOrg(ORG_ROLES.ADMIN, permissions)).toBe(false);
    expect(canOrg(ORG_ROLES.MEMBER, permissions)).toBe(false);
  });

  it("should require every action listed for a resource", () => {
    // member holds member:["read"] but not member:["delete"]
    expect(canOrg(ORG_ROLES.MEMBER, { member: ["read"] })).toBe(true);
    expect(canOrg(ORG_ROLES.MEMBER, { member: ["read", "delete"] })).toBe(false);
  });

  it("should require every resource listed", () => {
    const permissions = { member: ["delete"], invitation: ["cancel"] };
    expect(canOrg(ORG_ROLES.ADMIN, permissions)).toBe(true);
    // member holds neither
    expect(canOrg(ORG_ROLES.MEMBER, permissions)).toBe(false);
  });

  it("should deny an unknown resource rather than throwing", () => {
    expect(canOrg(ORG_ROLES.OWNER, { nonexistent: ["read"] })).toBe(false);
  });

  it("should deny an unknown role rather than throwing", () => {
    expect(canOrg("nonexistent", { organization: ["read"] })).toBe(false);
  });

  it("should grant when any role in a comma-separated list allows it", () => {
    // better-auth stores multi-role members as "a,b" and ORs across them
    expect(canOrg("member,admin", { organization: ["update"] })).toBe(true);
    expect(canOrg("member,admin", { organization: ["delete"] })).toBe(false);
  });
});

describe("canAdmin", () => {
  // These maps gate every platform-admin mutation. moderatorRole holds NO user/session
  // statements, so a regression that grants any of them to a moderator is a
  // privilege escalation — the whole "moderators cannot manage users" guarantee.
  const USER_MUTATIONS = [
    { user: ["list"] },
    { user: ["set-role"] },
    { user: ["ban"] },
    { user: ["impersonate"] },
    { user: ["delete"] },
    { session: ["revoke"] },
  ];

  it("should grant every user/session mutation to admin", () => {
    for (const permissions of USER_MUTATIONS) {
      expect(canAdmin(ADMIN_ROLES.ADMIN, permissions)).toBe(true);
    }
  });

  it("should deny every user/session mutation to moderator", () => {
    for (const permissions of USER_MUTATIONS) {
      expect(canAdmin(ADMIN_ROLES.MODERATOR, permissions)).toBe(false);
    }
  });

  it("should deny every user/session mutation to user", () => {
    for (const permissions of USER_MUTATIONS) {
      expect(canAdmin(ADMIN_ROLES.USER, permissions)).toBe(false);
    }
  });

  it("should deny impersonate-admins even to admin", () => {
    // adminAc omits "impersonate-admins", so better-auth blocks admin→admin
    // impersonation. This pins that block: never grant it in our role map.
    expect(canAdmin(ADMIN_ROLES.ADMIN, { user: ["impersonate-admins"] })).toBe(
      false
    );
  });

  it("should let admin read organizations and moderator read but not delete", () => {
    expect(canAdmin(ADMIN_ROLES.MODERATOR, { organization: ["read"] })).toBe(
      true
    );
    expect(canAdmin(ADMIN_ROLES.MODERATOR, { organization: ["delete"] })).toBe(
      false
    );
    expect(canAdmin(ADMIN_ROLES.ADMIN, { organization: ["delete"] })).toBe(true);
  });

  it("should treat null/undefined/empty role as the default user role", () => {
    expect(canAdmin(null, { user: ["list"] })).toBe(false);
    expect(canAdmin(undefined, { user: ["list"] })).toBe(false);
    expect(canAdmin("", { user: ["list"] })).toBe(false);
    expect(canAdmin(null, { organization: ["read"] })).toBe(true);
  });

  it("should OR across a comma-separated role list", () => {
    expect(canAdmin("user,moderator", { organization: ["read"] })).toBe(true);
    expect(canAdmin("user,admin", { user: ["ban"] })).toBe(true);
    expect(canAdmin("user,moderator", { user: ["ban"] })).toBe(false);
  });

  it("should deny an unknown role or resource rather than throwing", () => {
    expect(canAdmin("nonexistent", { user: ["list"] })).toBe(false);
    expect(canAdmin(ADMIN_ROLES.ADMIN, { nonexistent: ["read"] })).toBe(false);
  });
});

describe("isAdminAreaRole", () => {
  it("should admit admin and moderator, reject user", () => {
    expect(isAdminAreaRole(ADMIN_ROLES.ADMIN)).toBe(true);
    expect(isAdminAreaRole(ADMIN_ROLES.MODERATOR)).toBe(true);
    expect(isAdminAreaRole(ADMIN_ROLES.USER)).toBe(false);
  });

  it("should reject null, undefined, and empty as non-staff", () => {
    expect(isAdminAreaRole(null)).toBe(false);
    expect(isAdminAreaRole(undefined)).toBe(false);
    expect(isAdminAreaRole("")).toBe(false);
  });

  it("should admit a comma-separated list containing a staff role", () => {
    expect(isAdminAreaRole("user,moderator")).toBe(true);
    expect(isAdminAreaRole("user")).toBe(false);
  });
});
