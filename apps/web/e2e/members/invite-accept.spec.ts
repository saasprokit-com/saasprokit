import { expect, localePath, TEST_CONFIG, test } from "../fixtures/fixtures";
import {
  cancelInvitation,
  getOrgBySlug,
  inviteMember,
  signInViaApi,
} from "../helpers/org-api";
import { ensureVerifiedUser } from "../helpers/test-user";

test.describe("Invite Accept — error states", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("Should see Invalid Invitation When the token is missing", async ({
    page,
  }) => {
    await page.goto(localePath("/invite/accept"));
    await expect(page.getByText("Invalid Invitation")).toBeVisible();
    await expect(
      page.getByText(/invitation link is invalid or missing/i)
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /go to homepage/i })
    ).toHaveAttribute("href", "/");
  });

  test("Should see Invitation Not Found When the token doesn't exist", async ({
    page,
  }) => {
    const fakeToken = "00000000-0000-0000-0000-000000000000";
    await page.goto(localePath(`/invite/accept?token=${fakeToken}`));
    await expect(
      page.getByText(/invitation not found/i).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /go to homepage/i })
    ).toBeVisible();
  });
});

test.describe("Invite Accept — real invitation flow", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("Should see a mismatch guard instead of the accept button When signed in with a different email", async ({
    page,
    playwright,
    baseURL,
  }) => {
    const ownerApi = await playwright.request.newContext({
      baseURL,
      storageState: "e2e/.auth/user.json",
    });
    const targetEmail = `e2e-mismatch-${Date.now()}@example.com`;
    let invitationId: string | undefined;

    try {
      const org = await getOrgBySlug(ownerApi, TEST_CONFIG.org.slug);
      const invitation = await inviteMember(ownerApi, {
        organizationId: org.id,
        email: targetEmail,
        role: "member",
      });
      invitationId = invitation.id;

      await signInViaApi(
        page,
        TEST_CONFIG.user.email,
        TEST_CONFIG.user.password
      );
      await page.goto(localePath(`/invite/accept?token=${invitationId}`));

      // Scope to the mismatch banner paragraph itself: the invitation-email
      // also appears in the "Invited as: {email}" details line above it, so
      // a page-wide getByText(targetEmail) hits both and violates strict mode.
      const mismatchBanner = page.getByText(/this invitation was sent to/i);
      await expect(mismatchBanner).toBeVisible();
      await expect(mismatchBanner).toContainText(targetEmail);
      await expect(
        page.getByRole("button", { name: "Accept Invitation" })
      ).toHaveCount(0);
    } finally {
      if (invitationId) {
        await cancelInvitation(ownerApi, invitationId);
      }
      await ownerApi.dispose();
    }
  });

  test("Should show a member-limit error When a matching invitee accepts an invite to a full Free-plan org", async ({
    page,
    playwright,
    baseURL,
  }) => {
    const ownerApi = await playwright.request.newContext({
      baseURL,
      storageState: "e2e/.auth/user.json",
    });
    const invitee = {
      name: "E2E Invitee",
      email: `e2e-invitee-${Date.now()}@example.com`,
      password: "InviteePass123!",
    };
    let invitationId: string | undefined;

    try {
      // Verify the invitee (so they can sign in); this signs them in on `page`.
      const { verified } = await ensureVerifiedUser(page.request, invitee);
      expect(verified).toBe(true);

      const org = await getOrgBySlug(ownerApi, TEST_CONFIG.org.slug);
      const invitation = await inviteMember(ownerApi, {
        organizationId: org.id,
        email: invitee.email,
        role: "member",
      });
      invitationId = invitation.id;

      await page.goto(localePath(`/invite/accept?token=${invitationId}`));
      await expect(page.getByText("You're invited!")).toBeVisible();

      await page
        .getByRole("button", { name: "Accept Invitation" })
        .click();

      // The Free org is at its 1-member cap, so acceptInvitationAction's
      // seat-cap guard rejects the accept with the member-limit error.
      await expect(
        page.getByText(/reached its member limit/i)
      ).toBeVisible({ timeout: TEST_CONFIG.timeouts.action });
    } finally {
      if (invitationId) {
        await cancelInvitation(ownerApi, invitationId);
      }
      await ownerApi.dispose();
    }
  });
});
