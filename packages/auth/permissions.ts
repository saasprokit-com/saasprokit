import type { AccessControl } from "better-auth/plugins/access";
import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";
import { defaultStatements as orgDefaultStatements } from "better-auth/plugins/organization/access";

export const ADMIN_ROLES = {
  ADMIN: "admin",
  MODERATOR: "moderator",
  USER: "user",
} as const;

export type AdminRoleName = (typeof ADMIN_ROLES)[keyof typeof ADMIN_ROLES];

export const ORG_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
} as const;

export type OrgRoleName = (typeof ORG_ROLES)[keyof typeof ORG_ROLES];

/**
 * Permission action constants - use these for permission checks
 */
export const PERMISSIONS = {
  // CRUD actions
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  // Content-specific
  PUBLISH: "publish",
  // Member-specific
  INVITE: "invite",
  REMOVE: "remove",
  UPDATE_ROLE: "update-role",
  // Billing-specific
  MANAGE: "manage",
  VIEW: "view",
} as const;

export type PermissionAction = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Resource constants - use these for permission checks
 */
export const RESOURCES = {
  ORGANIZATION: "organization",
  MEMBER: "member",
  BILLING: "billing",
  CONTENT: "content",
  TEAM: "team",
  USER: "user",
  SESSION: "session",
} as const;

export type ResourceName = (typeof RESOURCES)[keyof typeof RESOURCES];

export const statement = {
  ...defaultStatements,
  // Organization permissions
  organization: ["create", "read", "update", "delete"],
  // Member permissions
  member: ["invite", "remove", "update-role"],
  // Billing permissions
  billing: ["manage", "view"],
  // Content permissions (for SaaS features)
  content: ["create", "read", "update", "delete", "publish"],
} as const;

export const ac = createAccessControl(statement);

export const adminRole = ac.newRole({
  ...adminAc.statements,
  organization: ["create", "read", "update", "delete"],
  member: ["invite", "remove", "update-role"],
  billing: ["manage", "view"],
  content: ["create", "read", "update", "delete", "publish"],
});

export const moderatorRole = ac.newRole({
  organization: ["read"],
  member: ["invite", "remove"],
  billing: ["view"],
  content: ["create", "read", "update", "delete", "publish"],
});

export const userRole = ac.newRole({
  organization: ["read"],
  billing: ["view"],
  content: ["create", "read", "update"],
});

export const adminRoleDefinitions = {
  [ADMIN_ROLES.ADMIN]: adminRole,
  [ADMIN_ROLES.MODERATOR]: moderatorRole,
  [ADMIN_ROLES.USER]: userRole,
} as const;

export const orgAc = createAccessControl(orgDefaultStatements) as AccessControl;

export const orgOwnerRole = orgAc.newRole({
  organization: ["read", "update", "delete"],
  member: ["read", "create", "update", "delete"],
  invitation: ["read", "create", "cancel"],
  team: ["create", "update", "delete"],
});

export const orgAdminRole = orgAc.newRole({
  organization: ["read", "update"],
  member: ["read", "create", "update", "delete"],
  invitation: ["read", "create", "cancel"],
  team: ["create", "update", "delete"],
});

export const orgMemberRole = orgAc.newRole({
  organization: ["read"],
  member: ["read"],
  invitation: ["read"],
});

export const orgRoleDefinitions = {
  [ORG_ROLES.OWNER]: orgOwnerRole,
  [ORG_ROLES.ADMIN]: orgAdminRole,
  [ORG_ROLES.MEMBER]: orgMemberRole,
} as const;

export function isOwnerRole(role: string): boolean {
  return role.split(",").includes(ORG_ROLES.OWNER);
}

export function canOrg(
  role: string,
  permissions: Record<string, string[]>
): boolean {
  return role
    .split(",")
    .some(
      (name) =>
        orgRoleDefinitions[name as OrgRoleName]?.authorize(permissions)
          .success === true
    );
}

export function canAdmin(
  role: string | null | undefined,
  permissions: Record<string, string[]>
): boolean {
  return (role || ADMIN_ROLES.USER)
    .split(",")
    .some(
      (name) =>
        adminRoleDefinitions[name as AdminRoleName]?.authorize(permissions)
          .success === true
    );
}

export const ADMIN_AREA_ROLES: readonly AdminRoleName[] = [
  ADMIN_ROLES.ADMIN,
  ADMIN_ROLES.MODERATOR,
];

export function isAdminAreaRole(role: string | null | undefined): boolean {
  return (role || ADMIN_ROLES.USER)
    .split(",")
    .some((name) => ADMIN_AREA_ROLES.includes(name as AdminRoleName));
}
