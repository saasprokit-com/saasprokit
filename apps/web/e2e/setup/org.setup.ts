import { writeFileSync } from "node:fs";

import { test as setup } from "@playwright/test";
import { LIMITS } from "@repo/utils/payment";

import { BASE_URL, TEST_CONFIG } from "../fixtures/test-config";
import { postAuth } from "../helpers/auth-api";
import type { Organization } from "../helpers/org-api";

const ORG_SLUG_PATH = "e2e/.auth/org-slug.txt";
const DEFAULT_SLUG = "e2e-test-org";

// Verified, unbanned, no-2FA users from packages/database/prisma/seed.ts.
// Reusing them keeps this step to one /sign-in/email each — creating users
// instead would spend sign-ups, and Better Auth allows only 3 per minute in
// production, which is how CI runs the app.
const SEEDED_FILLERS = ["john@example.com", "jane@example.com"];
const SEEDED_PASSWORD = "Password@saaspro";

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

// members/invite-accept.spec.ts asserts that accepting an invite into a full
// Free-plan org is refused. Without this the org only reaches its limit by
// accumulating members leaked by earlier runs, so the assertion passes on some
// machines and fails on a freshly seeded database.
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

    const memberEmails = async (): Promise<string[]> => {
      const res = await request.get(
        `/api/auth/organization/get-full-organization?organizationId=${org.id}`
      );
      if (!res.ok()) {
        throw new Error(`get-full-organization failed: ${res.status()}`);
      }
      const full = await res.json();
      return (full.members ?? []).map(
        (m: { user?: { email?: string } }) => m.user?.email ?? ""
      );
    };

    const limit = LIMITS.FREE.MAX_MEMBERS;
    const existing = await memberEmails();
    let count = existing.length;

    if (count < limit && SEEDED_FILLERS.length < limit - 1) {
      throw new Error(
        `The Free plan allows ${limit} members but only ${SEEDED_FILLERS.length} seeded filler accounts are listed — add more from prisma/seed.ts`
      );
    }

    for (const email of SEEDED_FILLERS) {
      if (count >= limit) {
        break;
      }
      if (existing.includes(email)) {
        continue;
      }

      const fillerApi = await playwright.request.newContext({
        baseURL: BASE_URL,
      });
      try {
        const signIn = await postAuth(fillerApi, "/api/auth/sign-in/email", {
          email,
          password: SEEDED_PASSWORD,
        });
        if (!signIn.ok()) {
          throw new Error(
            `Could not sign in as the seeded user ${email}: ${signIn.status()}. Has the database been seeded (pnpm --filter @repo/database db:seed)?`
          );
        }

        const inviteRes = await request.post(
          "/api/auth/organization/invite-member",
          {
            headers: { origin: BASE_URL },
            data: { organizationId: org.id, email, role: "member" },
          }
        );
        if (!inviteRes.ok()) {
          throw new Error(
            `invite-member failed for ${email}: ${await inviteRes.text()}`
          );
        }
        const invitation = await inviteRes.json();

        const acceptRes = await fillerApi.post(
          "/api/auth/organization/accept-invitation",
          {
            headers: { origin: BASE_URL },
            data: { invitationId: invitation.id },
          }
        );
        if (!acceptRes.ok()) {
          throw new Error(
            `accept-invitation failed for ${email}: ${await acceptRes.text()}`
          );
        }
        count++;
      } finally {
        await fillerApi.dispose();
      }
    }

    if (count < limit) {
      throw new Error(
        `Organization has ${count} members but the Free plan limit is ${limit} — invite-accept limit assertions will not hold`
      );
    }
  }
);
