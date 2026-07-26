import { writeFileSync } from "node:fs";

import { test as setup } from "@playwright/test";

import { TEST_CONFIG } from "../fixtures/test-config";

const ORG_SLUG_PATH = "e2e/.auth/org-slug.txt";
const DEFAULT_SLUG = "e2e-test-org";
// Better Auth's CSRF origin check requires an Origin header on cookie-bearing
// POSTs; Playwright's `request` fixture doesn't send one like a real browser tab.
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

setup("create organization", async ({ request }) => {
  const healthRes = await request.get("/api/health");
  const health = await healthRes.json().catch(() => null);
  const dbHealthy = health?.checks?.database?.status === "ok";

  if (!dbHealthy) {
    setup.skip(true, "Database not available — cannot create organization");
    return;
  }

  const listRes = await request.get("/api/auth/organization/list");
  if (!listRes.ok()) {
    throw new Error(`organization/list failed: ${listRes.status()}`);
  }
  const orgs: Organization[] = await listRes.json();
  let org = orgs.find((o) => o.name === TEST_CONFIG.org.name);

  if (!org) {
    const createRes = await request.post("/api/auth/organization/create", {
      headers: { origin: BASE_URL },
      data: { name: TEST_CONFIG.org.name, slug: DEFAULT_SLUG },
    });

    if (createRes.ok()) {
      org = (await createRes.json()) as Organization;
    } else {
      // Slug collision on a shared/dev database — retry once with a unique slug.
      const retryRes = await request.post("/api/auth/organization/create", {
        headers: { origin: BASE_URL },
        data: {
          name: TEST_CONFIG.org.name,
          slug: `${DEFAULT_SLUG}-${Date.now()}`,
        },
      });
      if (!retryRes.ok()) {
        throw new Error(
          `organization/create failed twice: ${await retryRes.text()}`
        );
      }
      org = (await retryRes.json()) as Organization;
    }
  }

  writeFileSync(ORG_SLUG_PATH, org.slug);
});
