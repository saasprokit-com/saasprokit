import {
  ORG_ROLES,
  type OrgRoleName,
  orgRoleDefinitions,
} from "@repo/auth/permissions";
import type { InvitationStatusValue } from "@repo/utils/organization";

// ============================================================================
// Types
// ============================================================================

export interface Invitation {
  id: string;
  email: string;
  role: OrgRoleName | null;
  status: InvitationStatusValue;
  expiresAt: Date;
  createdAt: Date;
  inviter: {
    name: string | null;
  } | null;
}

export interface InviteLink {
  id: string;
  token: string;
  role: OrgRoleName;
  expiresAt: Date | null;
  maxUses: number | null;
  usedCount: number;
  createdAt: Date;
  isActive: boolean;
  createdBy: {
    name: string | null;
  } | null;
}

export interface MemberPermissions {
  canInvite: boolean;
  canRemove: boolean;
  canUpdateRole: boolean;
  canManageInvitations: boolean;
  canManageInviteLinks: boolean;
  canSuspend: boolean;
  canTransferOwnership: boolean;
  isOwner: boolean;
}

// ============================================================================
// Helper to get permissions
// ============================================================================

export function getMemberPermissions(role: OrgRoleName): MemberPermissions {
  const { statements } = orgRoleDefinitions[role];
  const memberPerms = statements.member ?? [];
  const invitationPerms = statements.invitation ?? [];

  return {
    canInvite: memberPerms.includes("create"),
    canRemove: memberPerms.includes("delete"),
    canUpdateRole: memberPerms.includes("update"),
    canManageInvitations: invitationPerms.includes("create"),
    canManageInviteLinks: invitationPerms.includes("create"),
    canSuspend: memberPerms.includes("update"),
    canTransferOwnership: role === ORG_ROLES.OWNER,
    isOwner: role === ORG_ROLES.OWNER,
  };
}

// ============================================================================
// Shared Constants
// ============================================================================

export const TOKEN_PREVIEW_LENGTH = 8;
export const SEARCH_DEBOUNCE_MS = 300;

// ============================================================================
// Shared Utilities
// ============================================================================

export function isInviteLinkExpired(expiresAt: Date | null): boolean {
  return expiresAt !== null && new Date(expiresAt) < new Date();
}

export function isInviteLinkMaxedOut(
  link: Pick<InviteLink, "maxUses" | "usedCount">
): boolean {
  return link.maxUses !== null && link.usedCount >= link.maxUses;
}

export function isInvitationExpired(expiresAt: Date): boolean {
  return new Date(expiresAt) < new Date();
}

// ============================================================================
// Shared Role Descriptions
// ============================================================================

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  [ORG_ROLES.ADMIN]:
    "Admins can invite and remove members, and manage settings.",
  [ORG_ROLES.MEMBER]: "Members have read access to the organization.",
};
