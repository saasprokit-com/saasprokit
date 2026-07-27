import type { APIRequestContext, Page } from "@playwright/test";
import { BASE_URL } from "../fixtures/test-config";

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface Invitation {
  id: string;
}

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
