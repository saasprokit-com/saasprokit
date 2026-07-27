import { readFileSync } from "node:fs";

function getOrgSlug(): string {
  try {
    return readFileSync("e2e/.auth/org-slug.txt", "utf-8").trim();
  } catch {
    return process.env.E2E_ORG_SLUG || "e2e-test-org";
  }
}

// App origin for the running app; also the Origin header on cookie-bearing API
// POSTs (Better Auth's CSRF check requires it from request contexts).
export const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

export const TEST_CONFIG = {
  locale: "en",

  user: {
    email: process.env.E2E_USER_EMAIL || "e2e-test@example.com",
    password: process.env.E2E_USER_PASSWORD || "TestPassword123!",
    name: "E2E Test User",
  },

  org: {
    name: "E2E Test Org",
    slug: getOrgSlug(),
  },

  timeouts: {
    navigation: 15_000,
    action: 10_000,
    toast: 5000,
  },
};

export function localePath(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/${TEST_CONFIG.locale}${clean}`;
}

// rewriteDefault strips the default locale ("en") from the URL, so org routes resolve at /<orgSlug>/... not /<locale>/<orgSlug>/...
export function orgPath(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/${TEST_CONFIG.org.slug}${clean}`;
}
