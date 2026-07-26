import type { APIRequestContext, Page } from "@playwright/test";

// Better Auth's CSRF origin check requires an Origin header on cookie-bearing
// POSTs; Playwright's `request` fixture / `request.newContext` don't send one
// like a real browser tab does. (Same requirement as e2e/setup/org.setup.ts.)
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface Invitation {
  id: string;
}

interface InvitationRecord {
  email: string;
  id: string;
  status: string;
}

/** Look up an organization the current session belongs to, by slug. */
export async function getOrgBySlug(
  request: APIRequestContext,
  slug: string
): Promise<Organization> {
  const res = await request.get("/api/auth/organization/list");
  if (!res.ok()) {
    throw new Error(`organization/list failed: ${res.status()}`);
  }
  const orgs: Organization[] = await res.json();
  const org = orgs.find((o) => o.slug === slug);
  if (!org) {
    throw new Error(
      `No organization with slug "${slug}" in the session's org list`
    );
  }
  return org;
}

/** Invite a member. Requires an authenticated owner/admin request context. */
export async function inviteMember(
  request: APIRequestContext,
  params: { organizationId: string; email: string; role?: string }
): Promise<Invitation> {
  const res = await request.post("/api/auth/organization/invite-member", {
    headers: { origin: BASE_URL },
    data: {
      organizationId: params.organizationId,
      email: params.email,
      role: params.role || "member",
    },
  });
  if (!res.ok()) {
    throw new Error(
      `invite-member failed: ${res.status()} ${await res.text()}`
    );
  }
  return res.json();
}

/** Cancel a pending invitation. Best-effort — never throws (cleanup call). */
export async function cancelInvitation(
  request: APIRequestContext,
  invitationId: string
): Promise<void> {
  await request
    .post("/api/auth/organization/cancel-invitation", {
      headers: { origin: BASE_URL },
      data: { invitationId },
    })
    .catch(() => undefined);
}

/**
 * Cancel a pending invitation identified only by its email, so a UI-submitted
 * invite (whose id the test never sees) doesn't accumulate in the shared org.
 * Best-effort — never throws.
 */
export async function cancelInvitationByEmail(
  request: APIRequestContext,
  params: { organizationId: string; email: string }
): Promise<void> {
  try {
    const res = await request.get(
      `/api/auth/organization/list-invitations?organizationId=${params.organizationId}`
    );
    if (!res.ok()) {
      return;
    }
    const invitations: InvitationRecord[] = await res.json();
    const match = invitations.find(
      (i) =>
        i.email.toLowerCase() === params.email.toLowerCase() &&
        i.status === "pending"
    );
    if (match) {
      await cancelInvitation(request, match.id);
    }
  } catch {
    // best-effort cleanup
  }
}

/** Remove a member. Best-effort — never throws (cleanup call). */
export async function removeMember(
  request: APIRequestContext,
  params: { organizationId: string; memberIdOrEmail: string }
): Promise<void> {
  await request
    .post("/api/auth/organization/remove-member", {
      headers: { origin: BASE_URL },
      data: {
        organizationId: params.organizationId,
        memberIdOrEmail: params.memberIdOrEmail,
      },
    })
    .catch(() => undefined);
}

/** Sign in via the Better Auth API — the session cookie lands in the page's own context. */
export async function signInViaApi(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  const res = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: BASE_URL },
    data: { email, password },
  });
  if (!res.ok()) {
    throw new Error(
      `sign-in/email failed: ${res.status()} ${await res.text()}`
    );
  }
}
