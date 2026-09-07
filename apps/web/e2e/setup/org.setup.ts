import { writeFileSync } from "node:fs";

import { test as setup } from "@playwright/test";
import { LIMITS } from "@repo/utils/payment";

import { BASE_URL, TEST_CONFIG } from "../fixtures/test-config";
import type { Organization } from "../helpers/org-api";
import { ensureVerifiedUser } from "../helpers/test-user";

const ORG_SLUG_PATH = "e2e/.auth/org-slug.txt";
const DEFAULT_SLUG = "e2e-test-org";
const FILLER_PASSWORD = "FillerPass123!";

// The fill step reads the org the first step creates.
setup.describe.configure({ mode: "serial" });

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

// members/invite-accept.spec.ts asserts that accepting an invite to a full
// Free-plan org is refused. Without this the org only reaches its limit by
// accumulating leaked members from earlier runs, so the assertion passes on
// some machines and fails on a freshly seeded database.
setup(
  "fill organization to the member limit",
  async ({ request, playwright }) => {
    const healthRes = await request.get("/api/health");
    const health = await healthRes.json().catch(() => null);
    if (health?.checks?.database?.status !== "ok") {
      setup.skip(true, "Database not available — cannot fill organization");
      return;
    }

    const orgs: Organization[] = await request
      .get("/api/auth/organization/list")
      .then((res) => res.json());
    const org = orgs.find((o) => o.name === TEST_CONFIG.org.name);
    if (!org) {
      throw new Error(`Organization "${TEST_CONFIG.org.name}" was not created`);
    }

    const countMembers = async (): Promise<number> => {
      const res = await request.get(
        `/api/auth/organization/get-full-organization?organizationId=${org.id}`
      );
      if (!res.ok()) {
        throw new Error(`get-full-organization failed: ${res.status()}`);
      }
      const full = await res.json();
      return (full.members ?? []).length;
    };

    const limit = LIMITS.FREE.MAX_MEMBERS;

    for (let i = 1; i < limit; i++) {
      if ((await countMembers()) >= limit) {
        break;
      }

      const filler = {
        name: `E2E Filler ${i}`,
        email: `e2e-filler-${i}@example.com`,
        password: FILLER_PASSWORD,
      };

      const fillerApi = await playwright.request.newContext({
        baseURL: BASE_URL,
      });
      try {
        const { verified } = await ensureVerifiedUser(fillerApi, filler);
        if (!verified) {
          throw new Error(
            `Could not verify ${filler.email} — is Maildev running?`
          );
        }

        const inviteRes = await request.post(
          "/api/auth/organization/invite-member",
          {
            headers: { origin: BASE_URL },
            data: {
              organizationId: org.id,
              email: filler.email,
              role: "member",
            },
          }
        );
        if (!inviteRes.ok()) {
          throw new Error(
            `invite-member failed for ${filler.email}: ${await inviteRes.text()}`
          );
        }
        const invitation = await inviteRes.json();

        await fillerApi.post("/api/auth/organization/accept-invitation", {
          headers: { origin: BASE_URL },
          data: { invitationId: invitation.id },
        });
      } finally {
        await fillerApi.dispose();
      }
    }

    const finalCount = await countMembers();
    if (finalCount < limit) {
      throw new Error(
        `Organization has ${finalCount} members but the Free plan limit is ${limit} — invite-accept limit assertions will not hold`
      );
    }
  }
);
