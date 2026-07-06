import {
  ORG_ROLES,
  type OrgRoleName,
  orgRoleDefinitions,
} from "@repo/auth/permissions";

export interface MemberPermissions {
  canInvite: boolean;
  canManageInvitations: boolean;
  canManageInviteLinks: boolean;
  canRemove: boolean;
  canSuspend: boolean;
  canTransferOwnership: boolean;
  canUpdateRole: boolean;
  isOwner: boolean;
}

export function getMemberPermissions(role: OrgRoleName): MemberPermissions {
  const { statements } = orgRoleDefinitions[role];
  // better-auth narrows default statements to ["read"]; @repo/auth/permissions
  // extends them with create/update/delete at runtime.
  const memberPerms = (statements.member ?? []) as readonly string[];
  const invitationPerms = (statements.invitation ?? []) as readonly string[];

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

export const TOKEN_PREVIEW_LENGTH = 8;
export const SEARCH_DEBOUNCE_MS = 300;

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

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  [ORG_ROLES.ADMIN]:
    "Admins can invite and remove members, and manage settings.",
  [ORG_ROLES.MEMBER]: "Members have read access to the organization.",
};
