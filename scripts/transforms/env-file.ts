import { randomBytes } from "node:crypto";

export interface EnvAnswers {
  adminEmails?: string;
  appName: string;
  authSecret: string;
  databaseUrl: string;
  githubClientId?: string;
  githubClientSecret?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
}

export function generateAuthSecret(): string {
  return randomBytes(48).toString("base64");
}

function quoteEnvValue(value: string): string {
  if (!value.includes('"')) {
    return `"${value}"`;
  }
  if (!value.includes("'")) {
    return `'${value}'`;
  }
  throw new Error(
    `Cannot write env value containing both quote types for a .env file: ${value.slice(0, 16)}...`
  );
}

function setKey(text: string, key: string, value: string): string {
  const pattern = new RegExp(`^#?\\s*${key}=.*$`, "m");
  return text.replace(pattern, () => `${key}=${quoteEnvValue(value)}`);
}

export function renderEnvLocal(example: string, answers: EnvAnswers): string {
  let out = example;
  out = setKey(out, "NEXT_PUBLIC_APP_NAME", answers.appName);
  out = setKey(out, "DATABASE_URL", answers.databaseUrl);
  out = setKey(out, "BETTER_AUTH_SECRET", answers.authSecret);
  const optional: [string, string | undefined][] = [
    ["ADMIN_EMAILS", answers.adminEmails],
    ["STRIPE_SECRET_KEY", answers.stripeSecretKey],
    ["STRIPE_WEBHOOK_SECRET", answers.stripeWebhookSecret],
    ["GOOGLE_CLIENT_ID", answers.googleClientId],
    ["GOOGLE_CLIENT_SECRET", answers.googleClientSecret],
    ["GITHUB_CLIENT_ID", answers.githubClientId],
    ["GITHUB_CLIENT_SECRET", answers.githubClientSecret],
  ];
  for (const [key, value] of optional) {
    if (value) {
      out = setKey(out, key, value);
    }
  }
  return out;
}

export function renderDatabaseEnv(databaseUrl: string): string {
  return [
    `DATABASE_URL="${databaseUrl}"`,
    "# Direct (non-pooled) endpoint for migrations when DATABASE_URL is pooled:",
    "# DIRECT_URL=",
    "",
  ].join("\n");
}
