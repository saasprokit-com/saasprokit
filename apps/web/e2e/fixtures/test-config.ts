import { readFileSync } from "node:fs";

function getOrgSlug(): string {
  try {
    return readFileSync("e2e/.auth/org-slug.txt", "utf-8").trim();
  } catch {
    return process.env.E2E_ORG_SLUG || "e2e-test-org";
  }
}

/** Shared test configuration and constants */
export const TEST_CONFIG = {
  /** Default locale for tests */
  locale: "en",

  /** Test user credentials */
  user: {
    email: process.env.E2E_USER_EMAIL || "e2e-test@example.com",
    password: process.env.E2E_USER_PASSWORD || "TestPassword123!",
    name: "E2E Test User",
  },

  /** Test organization */
  org: {
    name: "E2E Test Org",
    slug: getOrgSlug(),
  },

  /** Common timeouts */
  timeouts: {
    navigation: 15_000,
    action: 10_000,
    toast: 5000,
  },
};

/** Build a locale-prefixed URL path */
export function localePath(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/${TEST_CONFIG.locale}${clean}`;
}

/**
 * Build an org-scoped URL path.
 *
 * With `urlMappingStrategy: "rewriteDefault"`, the default locale ("en") is
 * stripped from the browser URL. Org-scoped routes therefore resolve at
 * `/<orgSlug>/...` — NOT `/<locale>/<orgSlug>/...`.
 */
export function orgPath(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/${TEST_CONFIG.org.slug}${clean}`;
}
