"use server";

import { logPasswordResetRequest } from "../logging";

/**
 * Thin server action wrapper for audit logging.
 * The actual password reset is handled client-side via authClient.requestPasswordReset.
 */
export async function logResetRequestAction(email: string): Promise<void> {
  await logPasswordResetRequest(email);
}
