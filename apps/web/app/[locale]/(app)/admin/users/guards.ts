import type { ActionErrorCode } from "@/lib/auth/action-error";

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

type GuardResult = { ok: true } | { ok: false; code: ActionErrorCode };

const SELF_TARGET_CODES: Partial<Record<UserMutationKind, ActionErrorCode>> = {
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
