import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { symmetricDecrypt } from "better-auth/crypto";
import { twoFactor } from "better-auth/plugins/two-factor";
import { beforeEach, describe, expect, it } from "vitest";
import { twoFactorAfterHook } from "./two-factor-hooks";

const BASE_URL = "http://localhost:3000";
const EMAIL = "totp-user@example.com";
const PASSWORD = "Password@saaspro1";

function buildAuth() {
  return betterAuth({
    appName: "saasprokit-test",
    baseURL: BASE_URL,
    secret: "test-secret-test-secret-test-secret-32",
    database: memoryAdapter({
      user: [],
      session: [],
      account: [],
      verification: [],
      twoFactor: [],
    }),
    emailAndPassword: { enabled: true },
    hooks: { after: twoFactorAfterHook },
    plugins: [twoFactor({ issuer: "saasprokit-test" })],
  });
}

type TestAuth = ReturnType<typeof buildAuth>;

interface StoredTwoFactor {
  id: string;
  secret: string;
  verified: boolean;
}

/**
 * Replays a response's `Set-Cookie` entries as a request `Cookie` header the
 * way a browser would, so a test can carry an auth flow across calls.
 */
function cookieHeader(response: Response, carried = ""): string {
  const jar = new Map<string, string>();
  for (const pair of carried.split(";")) {
    const [name, ...rest] = pair.trim().split("=");
    if (name && rest.length) {
      jar.set(name, rest.join("="));
    }
  }
  for (const entry of response.headers.getSetCookie()) {
    const [assignment] = entry.split(";");
    const [name, ...rest] = (assignment ?? "").split("=");
    if (name) {
      jar.set(name, rest.join("="));
    }
  }
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}

function headersWithCookies(cookies: string): Headers {
  return new Headers({ cookie: cookies, origin: BASE_URL });
}

async function storedTwoFactor(auth: TestAuth): Promise<StoredTwoFactor> {
  const context = await auth.$context;
  const user = await context.internalAdapter.findUserByEmail(EMAIL);
  const row = await context.adapter.findOne<StoredTwoFactor>({
    model: "twoFactor",
    where: [{ field: "userId", value: user?.user.id ?? "" }],
  });
  if (!row) {
    throw new Error("no twoFactor row");
  }
  return row;
}

/**
 * The `secret` in a TOTP URI is base32-encoded, so it cannot be fed back to
 * `generateTOTP`. Read the stored secret and undo the at-rest encryption
 * instead — the same thing `verifyTOTP` does before checking a code.
 */
async function activeTotpSecret(auth: TestAuth): Promise<string> {
  const context = await auth.$context;
  const row = await storedTwoFactor(auth);
  return await symmetricDecrypt({ key: context.secretConfig, data: row.secret });
}

async function totpCodeFor(auth: TestAuth, secret: string): Promise<string> {
  const { code } = await auth.api.generateTOTP({ body: { secret } });
  return code;
}

async function signUpAndSignIn(auth: TestAuth) {
  await auth.api.signUpEmail({
    body: { email: EMAIL, password: PASSWORD, name: "TOTP User" },
    headers: new Headers({ origin: BASE_URL }),
  });
  const response = await auth.api.signInEmail({
    body: { email: EMAIL, password: PASSWORD },
    headers: new Headers({ origin: BASE_URL }),
    asResponse: true,
  });
  return cookieHeader(response);
}

/** Runs the real enable → scan → verify setup so `twoFactorEnabled` is true. */
async function enableTotp(auth: TestAuth, cookies: string) {
  await auth.api.enableTwoFactor({
    body: { password: PASSWORD },
    headers: headersWithCookies(cookies),
  });
  const secret = await activeTotpSecret(auth);
  const response = await auth.api.verifyTOTP({
    body: { code: await totpCodeFor(auth, secret) },
    headers: headersWithCookies(cookies),
    asResponse: true,
  });
  if (response.status !== 200) {
    throw new Error(`2FA setup failed: ${await response.text()}`);
  }
  return { secret, cookies: cookieHeader(response, cookies) };
}

/**
 * Password sign-in on a 2FA account is the one path Better Auth gates itself,
 * so it is how a test reaches a pending TOTP challenge.
 */
async function passwordChallenge(auth: TestAuth): Promise<Response> {
  return await auth.api.signInEmail({
    body: { email: EMAIL, password: PASSWORD },
    headers: new Headers({ origin: BASE_URL }),
    asResponse: true,
  });
}

describe("two-factor secret rotation", () => {
  let auth: TestAuth;

  beforeEach(() => {
    auth = buildAuth();
  });

  it("keeps a re-issued TOTP secret unusable for sign-in until it is verified", async () => {
    const cookies = await signUpAndSignIn(auth);
    const first = await enableTotp(auth, cookies);

    await auth.api.enableTwoFactor({
      body: { password: PASSWORD },
      headers: headersWithCookies(first.cookies),
    });

    const rotated = await storedTwoFactor(auth);
    const rotatedSecret = await activeTotpSecret(auth);
    expect(rotatedSecret).not.toBe(first.secret);
    expect(rotated.verified).toBe(false);

    // A challenge raised before the new QR is scanned must reject the new code.
    const challenge = await passwordChallenge(auth);
    await expect(
      auth.api.verifyTOTP({
        body: { code: await totpCodeFor(auth, rotatedSecret) },
        headers: headersWithCookies(cookieHeader(challenge)),
      })
    ).rejects.toThrow();
  });

  it("activates the rotated secret once the user proves possession in session", async () => {
    const cookies = await signUpAndSignIn(auth);
    const first = await enableTotp(auth, cookies);

    await auth.api.enableTwoFactor({
      body: { password: PASSWORD },
      headers: headersWithCookies(first.cookies),
    });
    const rotatedSecret = await activeTotpSecret(auth);

    await auth.api.verifyTOTP({
      body: { code: await totpCodeFor(auth, rotatedSecret) },
      headers: headersWithCookies(first.cookies),
    });
    expect((await storedTwoFactor(auth)).verified).toBe(true);

    const challenge = await passwordChallenge(auth);
    const challengeCookies = cookieHeader(challenge);
    const verified = await auth.api.verifyTOTP({
      body: { code: await totpCodeFor(auth, rotatedSecret) },
      headers: headersWithCookies(challengeCookies),
      asResponse: true,
    });

    const session = await auth.api.getSession({
      headers: headersWithCookies(cookieHeader(verified, challengeCookies)),
    });
    expect(session?.user.email).toBe(EMAIL);
  });
});
