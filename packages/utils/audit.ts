export const ADMIN_AUDIT_ACTIONS = {
  BAN: "admin.user.ban",
  DELETE_USER: "admin.user.delete",
  IMPERSONATE: "admin.user.impersonate",
  REVOKE_SESSIONS: "admin.user.revoke_sessions",
  SET_ROLE: "admin.user.set_role",
  UNBAN: "admin.user.unban",
} as const;

export const ORG_AUDIT_ACTIONS = {
  DELETE: "org.delete",
  INVITATION_CANCEL: "org.invitation.cancel",
  INVITATION_RESEND: "org.invitation.resend",
  INVITE_LINK_CREATE: "org.invite_link.create",
  INVITE_LINK_REVOKE: "org.invite_link.revoke",
  MEMBER_BULK_INVITE: "org.member.bulk_invite",
  MEMBER_INVITE: "org.member.invite",
  MEMBER_REMOVE: "org.member.remove",
  MEMBER_SET_ROLE: "org.member.set_role",
  OWNERSHIP_TRANSFER: "org.ownership.transfer",
  PLAN_CHANGE: "org.plan.change",
  SETTINGS_UPDATE: "org.settings.update",
} as const;

export type AdminAuditAction =
  (typeof ADMIN_AUDIT_ACTIONS)[keyof typeof ADMIN_AUDIT_ACTIONS];

export type OrgAuditAction =
  (typeof ORG_AUDIT_ACTIONS)[keyof typeof ORG_AUDIT_ACTIONS];

export type AuditAction = AdminAuditAction | OrgAuditAction;
