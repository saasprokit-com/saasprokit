import { describe, expect, it } from "vitest";
import {
  ADMIN_AREA_ROLES,
  ADMIN_ROLES,
  ORG_ROLES,
  PERMISSIONS,
  RESOURCES,
  ac,
  adminRole,
  adminRoleDefinitions,
  canAdmin,
  canOrg,
  isAdminAreaRole,
  moderatorRole,
  orgAc,
  orgAdminRole,
  orgMemberRole,
  orgRoleDefinitions,
  orgOwnerRole,
  statement,
  userRole,
} from "./permissions";

describe("ADMIN_ROLES constant", () => {
  it("should define all expected admin roles", () => {
    expect(ADMIN_ROLES.ADMIN).toBe("admin");
    expect(ADMIN_ROLES.MODERATOR).toBe("moderator");
    expect(ADMIN_ROLES.USER).toBe("user");
  });

  it("should have exactly 3 keys", () => {
    expect(Object.keys(ADMIN_ROLES)).toEqual(["ADMIN", "MODERATOR", "USER"]);
  });
});

describe("ORG_ROLES constant", () => {
  it("should define all expected organization roles", () => {
    expect(ORG_ROLES.OWNER).toBe("owner");
    expect(ORG_ROLES.ADMIN).toBe("admin");
    expect(ORG_ROLES.MEMBER).toBe("member");
  });

  it("should have exactly 3 keys", () => {
    expect(Object.keys(ORG_ROLES)).toEqual(["OWNER", "ADMIN", "MEMBER"]);
  });
});

describe("PERMISSIONS constant", () => {
  it("should define CRUD actions", () => {
    expect(PERMISSIONS.CREATE).toBe("create");
    expect(PERMISSIONS.READ).toBe("read");
    expect(PERMISSIONS.UPDATE).toBe("update");
    expect(PERMISSIONS.DELETE).toBe("delete");
  });

  it("should define content-specific actions", () => {
    expect(PERMISSIONS.PUBLISH).toBe("publish");
  });

  it("should define member-specific actions", () => {
    expect(PERMISSIONS.INVITE).toBe("invite");
    expect(PERMISSIONS.REMOVE).toBe("remove");
    expect(PERMISSIONS.UPDATE_ROLE).toBe("update-role");
  });

  it("should define billing-specific actions", () => {
    expect(PERMISSIONS.MANAGE).toBe("manage");
    expect(PERMISSIONS.VIEW).toBe("view");
  });
});

describe("RESOURCES constant", () => {
  it("should define all resource types", () => {
    expect(RESOURCES.ORGANIZATION).toBe("organization");
    expect(RESOURCES.MEMBER).toBe("member");
    expect(RESOURCES.BILLING).toBe("billing");
    expect(RESOURCES.CONTENT).toBe("content");
    expect(RESOURCES.USER).toBe("user");
    expect(RESOURCES.SESSION).toBe("session");
  });
});

describe("Statement definitions", () => {
  it("should define organization permissions", () => {
    expect(statement.organization).toEqual([
      "create",
      "read",
      "update",
      "delete",
    ]);
  });

  it("should define member permissions", () => {
    expect(statement.member).toEqual(["invite", "remove", "update-role"]);
  });

  it("should define billing permissions", () => {
    expect(statement.billing).toEqual(["manage", "view"]);
  });

  it("should define content permissions", () => {
    expect(statement.content).toEqual([
      "create",
      "read",
      "update",
      "delete",
      "publish",
    ]);
  });
});

describe("Admin access control", () => {
  it("should be created successfully", () => {
    expect(ac).toBeDefined();
  });
});

describe("Admin role definitions", () => {
  it("should have admin, moderator, and user roles", () => {
    expect(adminRoleDefinitions.admin).toBeDefined();
    expect(adminRoleDefinitions.moderator).toBeDefined();
    expect(adminRoleDefinitions.user).toBeDefined();
  });

  it("should map to the correct role objects", () => {
    expect(adminRoleDefinitions.admin).toBe(adminRole);
    expect(adminRoleDefinitions.moderator).toBe(moderatorRole);
    expect(adminRoleDefinitions.user).toBe(userRole);
  });
});

describe("Organization access control", () => {
  it("should be created successfully", () => {
    expect(orgAc).toBeDefined();
  });

  it("should have a newRole method", () => {
    expect(typeof orgAc.newRole).toBe("function");
  });
});

describe("Organization role definitions", () => {
  it("should have owner, admin, and member roles", () => {
    expect(orgRoleDefinitions.owner).toBeDefined();
    expect(orgRoleDefinitions.admin).toBeDefined();
    expect(orgRoleDefinitions.member).toBeDefined();
  });

  it("should map to the correct role objects", () => {
    expect(orgRoleDefinitions.owner).toBe(orgOwnerRole);
    expect(orgRoleDefinitions.admin).toBe(orgAdminRole);
    expect(orgRoleDefinitions.member).toBe(orgMemberRole);
  });

  it("owner should have organization update and delete permissions", () => {
    const result = orgOwnerRole.authorize({ organization: ["update"] });
    expect(result.success).toBe(true);
    const deleteResult = orgOwnerRole.authorize({ organization: ["delete"] });
    expect(deleteResult.success).toBe(true);
  });

  it("org admin should have organization update but not delete", () => {
    const updateResult = orgAdminRole.authorize({
      organization: ["update"],
    });
    expect(updateResult.success).toBe(true);
    const deleteResult = orgAdminRole.authorize({
      organization: ["delete"],
    });
    expect(deleteResult.success).toBe(false);
  });

  it("org member should not have organization management permissions", () => {
    const updateResult = orgMemberRole.authorize({
      organization: ["update"],
    });
    expect(updateResult.success).toBe(false);
  });

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

  it("should expose admin and moderator as the area allowlist", () => {
    expect([...ADMIN_AREA_ROLES]).toEqual([
      ADMIN_ROLES.ADMIN,
      ADMIN_ROLES.MODERATOR,
    ]);
  });
});
