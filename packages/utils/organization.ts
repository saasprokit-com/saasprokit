export const MAX_ORGS_PER_USER = 10;

// Invitation statuses (as stored by Better Auth)
export const INVITATION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  CANCELED: "canceled",
  REJECTED: "rejected",
} as const;

export type InvitationStatusValue =
  (typeof INVITATION_STATUS)[keyof typeof INVITATION_STATUS];

// Organization name constraints
export const MAX_ORG_NAME_LENGTH = 100;
export const MIN_ORG_NAME_LENGTH = 2;

// Bulk invite limits
export const MAX_BULK_INVITE_COUNT = 50;
export const BULK_INVITE_CONCURRENCY = 5;

// Invite link constraints
export const MAX_INVITE_LINK_DAYS = 90;
export const DEFAULT_INVITE_LINK_DAYS = 7;
export const MAX_INVITE_LINK_USES = 1000;

// Token generation
export const INVITE_TOKEN_BYTES = 32;

// Invite link statuses (for URL filters and UI display)
export const INVITE_LINK_STATUS = {
  ACTIVE: "active",
  REVOKED: "revoked",
} as const;

export type InviteLinkStatusValue =
  (typeof INVITE_LINK_STATUS)[keyof typeof INVITE_LINK_STATUS];
