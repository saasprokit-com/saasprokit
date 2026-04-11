import { test, expect, TEST_CONFIG, localePath, orgPath } from "./fixtures/fixtures";

test.describe("23 - Invite Link Preview", () => {
  // ─── UI Tests (existing) ───────────────────────────────────────────

  test.describe("Invalid Token — UI", () => {
    test("TC-23-01: invalid token shows error card", async ({ page }) => {
      await page.goto(localePath("/invite/nonexistent-token-xyz"));
      await expect(
        page.getByText(/invalid invite link/i).first()
      ).toBeVisible();
    });

    test("TC-23-02: error page has go-to-homepage link", async ({ page }) => {
      await page.goto(localePath("/invite/nonexistent-token-xyz"));
      const link = page.getByRole("link", { name: /go to homepage/i });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/");
    });
  });

  test.describe("Unauthenticated User — UI", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("TC-23-03: unauthenticated user is redirected to sign-in or sees error", async ({
      page,
    }) => {
      await page.goto(localePath("/invite/nonexistent-token-xyz"));
      await page.waitForLoadState("networkidle");
      const url = page.url();
      const onSignIn = url.includes("/auth/sign-in");
      const hasError = await page
        .getByText(/invalid invite link/i)
        .first()
        .isVisible()
        .catch(() => false);
      expect(onSignIn || hasError).toBe(true);
    });
  });

  test.describe("Authenticated User — UI", () => {
    test.use({ storageState: "e2e/.auth/user.json" });

    test("TC-23-04: authenticated user with invalid token sees error", async ({
      page,
    }) => {
      await page.goto(localePath("/invite/nonexistent-token-xyz"));
      await expect(
        page.getByText(/invalid invite link/i).first()
      ).toBeVisible();
    });
  });

  // ─── Functional Tests ─────────────────────────────────────────────

  test.describe("Invite Link — Functional (Invalid/Missing Token)", () => {
    test.use({ storageState: "e2e/.auth/user.json" });

    test("TC-23-05: non-existent token renders error title and description", async ({
      page,
    }) => {
      await page.goto(localePath("/invite/does-not-exist-abc123"));

      // Verify the error card structure
      await expect(
        page.getByRole("heading", { name: /invalid invite link/i })
      ).toBeVisible();
      await expect(
        page.getByText(/this invite link is invalid or doesn't exist/i)
      ).toBeVisible();

      // Homepage link should point to root
      const homepageLink = page.getByRole("link", {
        name: /go to homepage/i,
      });
      await expect(homepageLink).toBeVisible();
      await expect(homepageLink).toHaveAttribute("href", "/");
    });

    test("TC-23-06: empty token segment renders 404 or error", async ({
      page,
    }) => {
      // Navigating to /invite/ without a token — Next.js should 404
      // because the [token] dynamic segment is required
      const response = await page.goto(localePath("/invite/"));
      const status = response?.status() ?? 0;

      // Either a 404 page or the invite layout renders an error
      const is404 = status === 404;
      const hasNotFoundText = await page
        .getByText(/not found|page not found|404/i)
        .first()
        .isVisible()
        .catch(() => false);
      const hasInvalidText = await page
        .getByText(/invalid/i)
        .first()
        .isVisible()
        .catch(() => false);

      expect(is404 || hasNotFoundText || hasInvalidText).toBe(true);
    });

    test("TC-23-07: very long token is handled gracefully (no 500)", async ({
      page,
    }) => {
      const longToken = "a".repeat(500);
      const response = await page.goto(localePath(`/invite/${longToken}`));
      const status = response?.status() ?? 0;

      // Should not crash — expect either the error card or a 404, not a 500
      expect(status).toBeLessThan(500);

      // Should show the invalid invite link error (query validates token length)
      await expect(
        page.getByText(/invalid invite link/i).first()
      ).toBeVisible();
    });

    test("TC-23-08: special characters in token are handled gracefully", async ({
      page,
    }) => {
      const response = await page.goto(
        localePath("/invite/<script>alert(1)</script>")
      );
      const status = response?.status() ?? 0;

      // Should not return 500
      expect(status).toBeLessThan(500);
    });
  });

  test.describe("Email Invitation Preview — Functional (Accept Page)", () => {
    test.use({ storageState: "e2e/.auth/user.json" });

    test("TC-23-09: accept page with missing invitation ID shows error", async ({
      page,
    }) => {
      // The accept page reads ?token= from searchParams
      await page.goto(localePath("/invite/accept"));

      await expect(
        page.getByRole("heading", { name: /invalid invitation/i })
      ).toBeVisible();
      await expect(
        page.getByText(/invalid or missing the invitation id/i)
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /go to homepage/i })
      ).toBeVisible();
    });

    test("TC-23-10: accept page with non-existent invitation ID shows not found", async ({
      page,
    }) => {
      await page.goto(
        localePath("/invite/accept?token=non-existent-invitation-id")
      );

      await expect(
        page.getByRole("heading", { name: /invitation not found/i })
      ).toBeVisible();
      await expect(
        page.getByText(/may have been cancelled or doesn't exist/i)
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /go to homepage/i })
      ).toBeVisible();
    });
  });

  test.describe("Unauthenticated Invite Link — Functional", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("TC-23-11: unauthenticated user hitting accept page is redirected or sees sign-in prompt", async ({
      page,
    }) => {
      await page.goto(
        localePath("/invite/accept?token=some-fake-invitation-id")
      );
      await page.waitForLoadState("networkidle");

      const url = page.url();
      const redirectedToSignIn = url.includes("/auth/sign-in");

      // Either redirected to sign-in (proxy.ts) or the page shows
      // "Invitation Not Found" (if proxy allows through) or sign-in links
      const hasSignInLink = await page
        .getByRole("link", { name: /sign in/i })
        .first()
        .isVisible()
        .catch(() => false);
      const hasNotFoundError = await page
        .getByText(/invitation not found|invalid invitation/i)
        .first()
        .isVisible()
        .catch(() => false);

      expect(redirectedToSignIn || hasSignInLink || hasNotFoundError).toBe(
        true
      );
    });
  });

  test.describe("Invite Link Error Card — Functional Navigation", () => {
    test.use({ storageState: "e2e/.auth/user.json" });

    test("TC-23-12: clicking homepage link from error card navigates to root", async ({
      page,
    }) => {
      await page.goto(localePath("/invite/nonexistent-token-xyz"));
      await expect(
        page.getByText(/invalid invite link/i).first()
      ).toBeVisible();

      const homepageLink = page.getByRole("link", {
        name: /go to homepage/i,
      });
      await homepageLink.click();
      await page.waitForLoadState("networkidle");

      // Should navigate to the root or locale root
      const url = page.url();
      const atRoot =
        url.endsWith("/") ||
        url.endsWith(`/${TEST_CONFIG.locale}`) ||
        url.endsWith(`/${TEST_CONFIG.locale}/`);
      expect(atRoot).toBe(true);
    });
  });
});
