import type { APIRequestContext } from "@playwright/test";

import { postAuth } from "./auth-api";
import { isMaildevAvailable, waitForEmailLink } from "./maildev";

export async function ensureVerifiedUser(
  request: APIRequestContext,
  user: { name: string; email: string; password: string }
): Promise<{ verified: boolean }> {
  const signInRes = await postAuth(request, "/api/auth/sign-in/email", {
    email: user.email,
    password: user.password,
  });

  if (signInRes.ok()) {
    return { verified: true };
  }

  const maildevUp = await isMaildevAvailable();
  const since = Date.now();

  await postAuth(request, "/api/auth/sign-up/email", {
    name: user.name,
    email: user.email,
    password: user.password,
  });

  if (!maildevUp) {
    return { verified: false };
  }

  try {
    const { url: verifyUrl } = await waitForEmailLink(user.email, "verify", {
      subjectContains: "verif",
      timeout: 10_000,
      since,
    });

    await request.get(verifyUrl);

    // `autoSignInAfterVerification` is on, so following the link already left a
    // session on this context. Reading it back confirms verification without
    // spending a second /sign-in/email against the production rate limit.
    const sessionRes = await request.get("/api/auth/get-session");
    if (!sessionRes.ok()) {
      return { verified: false };
    }
    const session = await sessionRes.json().catch(() => null);
    return { verified: Boolean(session?.user) };
  } catch {
    return { verified: false };
  }
}
