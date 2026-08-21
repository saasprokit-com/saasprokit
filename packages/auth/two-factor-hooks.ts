import { createAuthMiddleware } from "better-auth/api";

const TWO_FACTOR_PLUGIN_ID = "two-factor";
const TWO_FACTOR_TABLE = "twoFactor";

/**
 * `/two-factor/enable` deletes the caller's existing `twoFactor` row and writes
 * a fresh one, carrying over `verified: true` when the previous row was
 * verified. For a user re-running setup that makes an unscanned secret
 * authoritative the moment the dialog opens: the old authenticator and its
 * backup codes are already gone, so abandoning the dialog locks the account.
 *
 * Forcing the new row unverified restores the semantics of first-time setup —
 * `verifyTOTP` refuses an unverified secret during sign-in and flips the flag
 * itself once the user enters a code from the new QR.
 */
export const twoFactorAfterHook = createAuthMiddleware(async (ctx) => {
  if (ctx.path !== "/two-factor/enable") {
    return;
  }
  const issued = ctx.context.returned as { totpURI?: string } | null;
  if (!issued?.totpURI) {
    return;
  }
  const plugin = ctx.context.options.plugins?.find(
    (candidate) => candidate.id === TWO_FACTOR_PLUGIN_ID
  );
  // Respect an explicit opt-out rather than silently fighting the option.
  if (
    (plugin?.options as { skipVerificationOnEnable?: boolean } | undefined)
      ?.skipVerificationOnEnable
  ) {
    return;
  }
  const userId = ctx.context.session?.user.id;
  if (!userId) {
    return;
  }
  const row = await ctx.context.adapter.findOne<{
    id: string;
    verified?: boolean;
  }>({
    model: TWO_FACTOR_TABLE,
    where: [{ field: "userId", value: userId }],
  });
  // First-time setup already writes `verified: false`; only a carried-over
  // `true` from a rotation needs correcting.
  if (row?.verified !== true) {
    return;
  }
  await ctx.context.adapter.update({
    model: TWO_FACTOR_TABLE,
    where: [{ field: "id", value: row.id }],
    update: { verified: false },
  });
});
