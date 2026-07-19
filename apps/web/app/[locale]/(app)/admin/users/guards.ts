/**
 * Pure self-target guards for platform-admin user mutations.
 *
 * Peer model (D5): admins may set-role/ban/delete/impersonate OTHER admins; only
 * targeting yourself is blocked, to prevent an admin locking themselves out. These
 * checks run in the server action before the Better Auth call. Kept I/O-free so they
 * can be unit-tested exhaustively — the "moderators cannot manage users" guarantee is
 * enforced separately by checkAdminPermission.
 *
 * The returned `code` is an errors.action dictionary key.
 */
export type UserMutationKind =
  | "set-role"
  | "ban"
  | "delete"
  | "impersonate"
  | "revoke-sessions";

interface GuardInput {
  actorId: string;
  mutation: UserMutationKind;
  targetId: string;
}

type GuardResult = { ok: true } | { ok: false; code: string };

const SELF_TARGET_CODES: Partial<Record<UserMutationKind, string>> = {
  "set-role": "cannotChangeSelfRole",
  ban: "cannotBanSelf",
  delete: "cannotDeleteSelf",
  // Impersonating yourself is meaningless rather than dangerous — reject as bad input.
  impersonate: "invalidInput",
};

export function guardUserMutation(input: GuardInput): GuardResult {
  const isSelf = input.actorId === input.targetId;
  if (isSelf) {
    const code = SELF_TARGET_CODES[input.mutation];
    if (code) {
      return { ok: false, code };
    }
  }
  // revoke-sessions is always allowed (self-revoke is just a full logout).
  return { ok: true };
}
