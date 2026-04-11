import { describe, expect, it } from "vitest";
import {
  ADMIN_ROLES,
  ORG_ROLES,
  PERMISSIONS,
  RESOURCES,
  ac,
  adminRole,
  adminRoleDefinitions,
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
