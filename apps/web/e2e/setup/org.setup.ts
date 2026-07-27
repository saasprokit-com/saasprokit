import { writeFileSync } from "node:fs";

import { test as setup } from "@playwright/test";

import { BASE_URL, TEST_CONFIG } from "../fixtures/test-config";
import type { Organization } from "../helpers/org-api";

const ORG_SLUG_PATH = "e2e/.auth/org-slug.txt";
const DEFAULT_SLUG = "e2e-test-org";

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
