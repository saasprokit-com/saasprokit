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

/**
 * Define permission statements for the admin plugin.
 * These define what actions can be performed on each resource at the platform level.
 */
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

/**
 * Create the admin access control instance
 */
export const ac = createAccessControl(statement);

/**
 * Admin role - Full access to everything
 */
export const adminRole = ac.newRole({
  ...adminAc.statements,
  organization: ["create", "read", "update", "delete"],
  member: ["invite", "remove", "update-role"],
  billing: ["manage", "view"],
  content: ["create", "read", "update", "delete", "publish"],
});

/**
 * Moderator role - Limited admin access
 * Can manage content and members but not billing or org settings
 */
export const moderatorRole = ac.newRole({
  organization: ["read"],
  member: ["invite", "remove"],
  billing: ["view"],
  content: ["create", "read", "update", "delete", "publish"],
});

/**
 * User role - Basic user access
 * Can view and manage their own content
 */
export const userRole = ac.newRole({
  organization: ["read"],
  billing: ["view"],
  content: ["create", "read", "update"],
});

/**
 * Admin role definitions map - for programmatic access
 */
export const adminRoleDefinitions = {
  [ADMIN_ROLES.ADMIN]: adminRole,
  [ADMIN_ROLES.MODERATOR]: moderatorRole,
  [ADMIN_ROLES.USER]: userRole,
} as const;

/**
 * Create the org access control instance from the plugin's default statements.
 * Cast to AccessControl to satisfy the organization plugin's type signature.
 */
export const orgAc = createAccessControl(orgDefaultStatements) as AccessControl;

/**
 * Owner role - Full organization control
 * Can manage all aspects of the organization including deletion
 */
export const orgOwnerRole = orgAc.newRole({
  organization: ["read", "update", "delete"],
  member: ["read", "create", "update", "delete"],
  invitation: ["read", "create", "cancel"],
  team: ["create", "update", "delete"],
});

/**
 * Org admin role - Organization management without deletion
 * Can manage members and invitations but cannot delete the organization
 */
export const orgAdminRole = orgAc.newRole({
  organization: ["read", "update"],
  member: ["read", "create", "update", "delete"],
  invitation: ["read", "create", "cancel"],
  team: ["create", "update", "delete"],
});

/**
 * Org member role - Basic organization membership
 * Read-only access with no management capabilities
 */
export const orgMemberRole = orgAc.newRole({
  organization: ["read"],
  member: ["read"],
  invitation: ["read"],
});

/**
 * Organization role definitions map - for programmatic access
 */
export const orgRoleDefinitions = {
  [ORG_ROLES.OWNER]: orgOwnerRole,
  [ORG_ROLES.ADMIN]: orgAdminRole,
  [ORG_ROLES.MEMBER]: orgMemberRole,
} as const;

/**
 * Check an org role against a permission map, in memory.
 *
 * This is the same evaluation better-auth's `hasPermission` endpoint runs once its
 * own membership query returns the role — so callers that already hold the role
 * (pages, via getActiveOrganization) can skip that query entirely.
 *
 * Only pass a role read from the database. Never one supplied by the client: this
 * function trusts its argument completely.
 */
export function canOrg(
  role: string,
  permissions: Record<string, string[]>
): boolean {
  // A member's role column may hold several comma-separated roles; holding any one
  // that grants the permission is enough (matches better-auth's own semantics).
  return role
    .split(",")
    .some(
      (name) =>
        orgRoleDefinitions[name as OrgRoleName]?.authorize(permissions)
          .success === true
    );
}
