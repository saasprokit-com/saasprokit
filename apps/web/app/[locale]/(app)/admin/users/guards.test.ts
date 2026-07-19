import { describe, expect, it } from "vitest";
import { guardUserMutation, type UserMutationKind } from "./guards";

const ACTOR = "actor-1";
const OTHER = "target-2";

describe("guardUserMutation", () => {
  const selfBlocked: Array<[UserMutationKind, string]> = [
    ["set-role", "cannotChangeSelfRole"],
    ["ban", "cannotBanSelf"],
    ["delete", "cannotDeleteSelf"],
    ["impersonate", "invalidInput"],
  ];

  it("blocks self-targeting mutations with the right code", () => {
    for (const [mutation, code] of selfBlocked) {
      const result = guardUserMutation({
        actorId: ACTOR,
        targetId: ACTOR,
        mutation,
      });
      expect(result).toEqual({ ok: false, code });
    }
  });

  it("allows the same mutations against a different user", () => {
    for (const [mutation] of selfBlocked) {
      expect(
        guardUserMutation({ actorId: ACTOR, targetId: OTHER, mutation })
      ).toEqual({ ok: true });
    }
  });

  it("always allows revoke-sessions, even against self (logout-all is harmless)", () => {
    expect(
      guardUserMutation({
        actorId: ACTOR,
        targetId: ACTOR,
        mutation: "revoke-sessions",
      })
    ).toEqual({ ok: true });
    expect(
      guardUserMutation({
        actorId: ACTOR,
        targetId: OTHER,
        mutation: "revoke-sessions",
      })
    ).toEqual({ ok: true });
  });
});
