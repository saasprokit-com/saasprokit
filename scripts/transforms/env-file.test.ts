import { describe, expect, it } from "vitest";
import {
  generateAuthSecret,
  renderDatabaseEnv,
  renderEnvLocal,
} from "./env-file";

const EXAMPLE = `NEXT_PUBLIC_APP_NAME="MyApp"
DATABASE_URL="postgresql://dev:dev@localhost:5432/saasprokit_dev"
BETTER_AUTH_SECRET=
# ADMIN_EMAILS="you@yourdomain.com"
STRIPE_SECRET_KEY="sk_"
GOOGLE_CLIENT_ID=""
`;

const BASE = {
  appName: "Acme",
  databaseUrl: "postgresql://dev:dev@localhost:5432/acme_dev",
  authSecret: "s3cret",
};

describe("renderEnvLocal", () => {
  it("fills required values", () => {
    const out = renderEnvLocal(EXAMPLE, BASE);
    expect(out).toContain('NEXT_PUBLIC_APP_NAME="Acme"');
    expect(out).toContain('DATABASE_URL="postgresql://dev:dev@localhost:5432/acme_dev"');
    expect(out).toContain('BETTER_AUTH_SECRET="s3cret"');
  });

  it("uncomments and sets optional keys only when answered", () => {
    const withAdmin = renderEnvLocal(EXAMPLE, { ...BASE, adminEmails: "a@b.co" });
    expect(withAdmin).toContain('ADMIN_EMAILS="a@b.co"');
    expect(withAdmin).not.toContain('# ADMIN_EMAILS');
    const without = renderEnvLocal(EXAMPLE, BASE);
    expect(without).toContain('# ADMIN_EMAILS="you@yourdomain.com"');
  });

  it("sets provided secrets in place", () => {
    const out = renderEnvLocal(EXAMPLE, { ...BASE, stripeSecretKey: "sk_test_1" });
    expect(out).toContain('STRIPE_SECRET_KEY="sk_test_1"');
  });

  it("keeps replacement-pattern characters in values literal", () => {
    const url = "postgresql://u:p@ss$&w$$d@h:5432/db";
    const out = renderEnvLocal(EXAMPLE, { ...BASE, databaseUrl: url });
    expect(out).toContain(`DATABASE_URL="${url}"`);
  });

  it("single-quotes values that contain double quotes", () => {
    const out = renderEnvLocal(EXAMPLE, { ...BASE, appName: 'Acme "Beta"' });
    expect(out).toContain(`NEXT_PUBLIC_APP_NAME='Acme "Beta"'`);
  });

  it("throws on values containing both quote types", () => {
    expect(() =>
      renderEnvLocal(EXAMPLE, { ...BASE, appName: `A"B'C` })
    ).toThrow(/both quote types/);
  });
});

describe("generateAuthSecret", () => {
  it("is 48 bytes of base64 and unique per call", () => {
    const secret = generateAuthSecret();
    expect(Buffer.from(secret, "base64")).toHaveLength(48);
    expect(generateAuthSecret()).not.toBe(secret);
  });
});

describe("renderDatabaseEnv", () => {
  it("writes DATABASE_URL and a commented DIRECT_URL", () => {
    const out = renderDatabaseEnv("postgresql://x");
    expect(out).toContain('DATABASE_URL="postgresql://x"');
    expect(out).toContain("# DIRECT_URL=");
  });
});
