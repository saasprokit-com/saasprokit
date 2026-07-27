import type { APIRequestContext } from "@playwright/test";

import { BASE_URL } from "../fixtures/test-config";
import { clearInbox, isMaildevAvailable, waitForEmailLink } from "./maildev";

export async function ensureVerifiedUser(
  request: APIRequestContext,
  user: { name: string; email: string; password: string }
): Promise<{ verified: boolean }> {
  const signInRes = await request.post("/api/auth/sign-in/email", {
    headers: { origin: BASE_URL },
    data: { email: user.email, password: user.password },
  });

  if (signInRes.ok()) {
    return { verified: true };
  }

  const maildevUp = await isMaildevAvailable();
  if (maildevUp) {
    await clearInbox();
  }

  await request.post("/api/auth/sign-up/email", {
    headers: { origin: BASE_URL },
    data: {
      name: user.name,
      email: user.email,
      password: user.password,
    },
  });

  if (!maildevUp) {
    return { verified: false };
  }

  try {
    const { url: verifyUrl } = await waitForEmailLink(user.email, "verify", {
      subjectContains: "verif",
      timeout: 10_000,
    });

    await request.get(verifyUrl);

    const retryRes = await request.post("/api/auth/sign-in/email", {
      headers: { origin: BASE_URL },
      data: { email: user.email, password: user.password },
    });

    return { verified: retryRes.ok() };
  } catch {
    return { verified: false };
  }
}
