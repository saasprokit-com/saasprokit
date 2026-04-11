import { test, expect, TEST_CONFIG, localePath } from "./fixtures/fixtures";

test.describe("24 - Invite Accept (Email Invitation)", () => {
  // ---------------------------------------------------------------------------
  // UI Tests — Missing Token
  // ---------------------------------------------------------------------------
  test.describe("Missing Token", () => {
    test("TC-24-01: no token shows invalid invitation", async ({ page }) => {
      await page.goto(localePath("/invite/accept"));
      await expect(page.getByText(/invalid invitation/i).first()).toBeVisible();
    });

    test("TC-24-02: missing token error has go to homepage link", async ({ page }) => {
      await page.goto(localePath("/invite/accept"));
      const link = page.getByRole("link", { name: /go to homepage/i });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/");
    });
  });

  // ---------------------------------------------------------------------------
  // UI Tests — Non-existent Invitation
  // ---------------------------------------------------------------------------
  test.describe("Non-existent Invitation", () => {
    test("TC-24-03: invalid token shows invitation not found", async ({ page }) => {
      await page.goto(localePath("/invite/accept?token=nonexistent-id"));
      await expect(
        page.getByText(/invitation not found|invalid invitation/i).first()
      ).toBeVisible();
    });

    test("TC-24-04: not found error has go to homepage link", async ({ page }) => {
      await page.goto(localePath("/invite/accept?token=nonexistent-id"));
      const link = page.getByRole("link", { name: /go to homepage/i });
      await expect(link).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // UI Tests — Unauthenticated User
  // ---------------------------------------------------------------------------
  test.describe("Unauthenticated User", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("TC-24-05: unauthenticated sees sign-in prompt or error", async ({ page }) => {
      await page.goto(localePath("/invite/accept?token=some-token"));
      // The (app) route group may redirect unauthenticated users via proxy.ts,
      // or the page itself renders sign-in links for guests.
      await page.waitForLoadState("networkidle");
      const url = page.url();
      const onSignIn = url.includes("/auth/sign-in");
      const hasError = await page
        .getByText(/invitation not found|invalid/i)
        .first()
        .isVisible()
        .catch(() => false);
      expect(onSignIn || hasError).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // UI Tests — Authenticated User
  // ---------------------------------------------------------------------------
  test.describe("Authenticated User", () => {
    test.use({ storageState: "e2e/.auth/user.json" });

    test("TC-24-06: authenticated with invalid token sees error", async ({ page }) => {
      await page.goto(localePath("/invite/accept?token=nonexistent-id"));
      await expect(
        page.getByText(/invitation not found|invalid invitation/i).first()
      ).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Functional Tests — Missing / Invalid Token Handling
  // ---------------------------------------------------------------------------
  test.describe("Functional: Missing invitation token", () => {
    test("TC-24-07: navigating without token query param renders Invalid Invitation card", async ({
      page,
    }) => {
      await page.goto(localePath("/invite/accept"));

      // The card title should contain "Invalid Invitation"
      await expect(page.getByText("Invalid Invitation")).toBeVisible();

      // Explanatory text should be present
      await expect(
        page.getByText(/invitation link is invalid or missing/i)
      ).toBeVisible();

      // Homepage link should be rendered and clickable
      const homepageLink = page.getByRole("link", { name: /go to homepage/i });
      await expect(homepageLink).toBeVisible();
      await expect(homepageLink).toHaveAttribute("href", "/");
    });

    test("TC-24-08: navigating with empty token query param renders Invalid Invitation", async ({
      page,
    }) => {
      await page.goto(localePath("/invite/accept?token="));

      await expect(page.getByText("Invalid Invitation")).toBeVisible();
      await expect(
        page.getByText(/invitation link is invalid or missing/i)
      ).toBeVisible();
    });
  });

  test.describe("Functional: Invalid / fake token", () => {
    test("TC-24-09: fake UUID-style token shows Invitation Not Found", async ({
      page,
    }) => {
      const fakeToken = "00000000-0000-0000-0000-000000000000";
      await page.goto(localePath(`/invite/accept?token=${fakeToken}`));

      // Should display "Invitation Not Found" (DB lookup returns null)
      await expect(
        page.getByText(/invitation not found/i).first()
      ).toBeVisible();

      // Should explain the invitation may have been cancelled
      await expect(
        page.getByText(/may have been cancelled or doesn't exist/i)
      ).toBeVisible();

      // Homepage link present
      const homepageLink = page.getByRole("link", { name: /go to homepage/i });
      await expect(homepageLink).toBeVisible();
    });

    test("TC-24-10: random string token shows Invitation Not Found", async ({
      page,
    }) => {
      await page.goto(
        localePath("/invite/accept?token=totally-fake-invitation-token-xyz")
      );

      await expect(
        page.getByText(/invitation not found/i).first()
      ).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Functional Tests — Unauthenticated Access
  // ---------------------------------------------------------------------------
  test.describe("Functional: Unauthenticated access to invite accept", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("TC-24-11: unauthenticated user is either redirected to sign-in or sees sign-in prompt", async ({
      page,
    }) => {
      await page.goto(localePath("/invite/accept?token=some-invitation-id"));
      await page.waitForLoadState("networkidle");

      const url = page.url();
      const redirectedToSignIn = url.includes("/auth/sign-in");

      if (redirectedToSignIn) {
        // Proxy.ts redirected — the callback URL should preserve the invite path
        expect(url).toContain("callbackUrl");
        expect(decodeURIComponent(url)).toContain("/invite/accept");
      } else {
        // Page rendered for guests — should show sign-in / sign-up links or error
        const hasSignInLink = await page
          .getByRole("link", { name: /sign in to accept/i })
          .isVisible()
          .catch(() => false);
        const hasError = await page
          .getByText(/invitation not found|invalid invitation/i)
          .first()
          .isVisible()
          .catch(() => false);

        expect(hasSignInLink || hasError).toBe(true);
      }
    });

    test("TC-24-12: unauthenticated with missing token still shows error, not sign-in", async ({
      page,
    }) => {
      await page.goto(localePath("/invite/accept"));
      await page.waitForLoadState("networkidle");

      const url = page.url();
      const redirectedToSignIn = url.includes("/auth/sign-in");

      if (!redirectedToSignIn) {
        // Missing token should show Invalid Invitation even for guests
        await expect(page.getByText(/invalid invitation/i).first()).toBeVisible();
      }
      // If redirected, the proxy protects the route regardless — that is valid behavior
    });
  });

  // ---------------------------------------------------------------------------
  // Functional Tests — Authenticated with invalid token (card structure)
  // ---------------------------------------------------------------------------
  test.describe("Functional: Authenticated error card structure", () => {
    test.use({ storageState: "e2e/.auth/user.json" });

    test("TC-24-13: authenticated user sees full error card for non-existent invitation", async ({
      page,
    }) => {
      await page.goto(localePath("/invite/accept?token=does-not-exist-abc123"));

      // Card title
      await expect(
        page.getByText(/invitation not found/i).first()
      ).toBeVisible();

      // Card description
      await expect(
        page.getByText(/may have been cancelled or doesn't exist/i)
      ).toBeVisible();

      // Homepage link
      const link = page.getByRole("link", { name: /go to homepage/i });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/");
    });

    test("TC-24-14: clicking homepage link from error navigates to root", async ({
      page,
    }) => {
      await page.goto(localePath("/invite/accept?token=does-not-exist-abc123"));

      const link = page.getByRole("link", { name: /go to homepage/i });
      await expect(link).toBeVisible();
      await link.click();

      await page.waitForLoadState("networkidle");
      // Should navigate to the homepage (root or locale root)
      const finalUrl = page.url();
      const pathname = new URL(finalUrl).pathname;
      expect(pathname === "/" || pathname === `/${TEST_CONFIG.locale}`).toBe(true);
    });

    test("TC-24-15: no accept button or join UI visible for non-existent invitation", async ({
      page,
    }) => {
      await page.goto(localePath("/invite/accept?token=invalid-token-999"));

      // Accept button should NOT be visible
      const acceptBtn = page.getByRole("button", {
        name: /accept invitation/i,
      });
      await expect(acceptBtn).not.toBeVisible();

      // "You're invited!" heading should NOT be visible
      const invitedHeading = page.getByText(/you're invited/i);
      await expect(invitedHeading).not.toBeVisible();
    });
  });
});
