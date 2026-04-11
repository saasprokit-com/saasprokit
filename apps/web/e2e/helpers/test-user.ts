/**
 * Test user management helpers.
 *
 * Creates test users via the API and verifies their email
 * using the Maildev-captured verification link.
 */

import type { APIRequestContext } from "@playwright/test";

import { clearInbox, isMaildevAvailable, waitForEmailLink } from "./maildev";

/**
 * Ensure a verified test user exists.
 *
 * Strategy:
 * 1. Try to sign in — if it works, user is already verified
 * 2. If sign-in fails, sign up + verify email via Maildev
 *
 * Returns whether the user can sign in after this call.
 */
export async function ensureVerifiedUser(
  request: APIRequestContext,
  user: { name: string; email: string; password: string }
): Promise<{ verified: boolean }> {
  // First, try signing in — fastest path if user already exists and is verified
  const signInRes = await request.post("/api/auth/sign-in/email", {
    data: { email: user.email, password: user.password },
  });

  if (signInRes.ok()) {
    return { verified: true };
  }

  // Sign-in failed — user doesn't exist or isn't verified
  // Clear inbox, sign up, and verify via Maildev
  const maildevUp = await isMaildevAvailable();
  if (maildevUp) {
    await clearInbox();
  }

  // Sign up (ignore errors if user already exists)
  await request.post("/api/auth/sign-up/email", {
    data: {
      name: user.name,
      email: user.email,
      password: user.password,
    },
  });

  // Verify email via Maildev
  if (!maildevUp) {
    return { verified: false };
  }

  try {
    const { url: verifyUrl } = await waitForEmailLink(user.email, "verify", {
      subjectContains: "verif",
      timeout: 10_000,
    });

    // Visit the verification URL to mark email as verified
    await request.get(verifyUrl);

    // Confirm sign-in works now
    const retryRes = await request.post("/api/auth/sign-in/email", {
      data: { email: user.email, password: user.password },
    });

    return { verified: retryRes.ok() };
  } catch {
    return { verified: false };
  }
}
