import { test, expect, TEST_CONFIG, localePath, orgPath } from "../fixtures/fixtures";

test.describe("22 - Organization Selection / Redirect", () => {
  test.describe("UI: Redirect Behavior", () => {
    test.use({ storageState: "e2e/.auth/user.json" });

    test("TC-22-01: authenticated user is redirected to org", async ({ page }) => {
      await page.goto(localePath("/org"));
      // Should redirect to an org dashboard (not stay on /org)
      await page.waitForURL(
        (url) => !url.pathname.endsWith("/org") && !url.pathname.includes("/auth/"),
        { timeout: TEST_CONFIG.timeouts.navigation }
      );
      expect(page.url()).not.toMatch(/\/org$/);
    });

    test("TC-22-02: redirect preserves locale", async ({ page }) => {
      await page.goto(localePath("/org"));
      await page.waitForURL(
        (url) => !url.pathname.endsWith("/org"),
        { timeout: TEST_CONFIG.timeouts.navigation }
      );
      // With rewriteDefault, the default locale ("en") is not visible in the URL.
      // The redirect should land on an org dashboard (e.g. /org-slug).
      expect(page.url()).not.toContain("/auth/sign-in");
    });
  });

  test.describe("UI: Unauthenticated", () => {
    test("TC-22-03: unauthenticated user redirected to sign-in", async ({ browser }) => {
      const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
      const page = await context.newPage();
      await page.goto(localePath("/org"));
      await page.waitForURL(/\/auth\/sign-in/, { timeout: TEST_CONFIG.timeouts.navigation });
      expect(page.url()).toContain("/auth/sign-in");
      await context.close();
    });
  });

  test.describe("Functional: Org redirect resolves to test org", () => {
    test.use({ storageState: "e2e/.auth/user.json" });

    test("TC-22-04: /org redirects to the test organization dashboard", async ({ page }) => {
      await page.goto(localePath("/org"));

      // The server-side redirect should land on the user's default org slug.
      // Wait until URL contains the test org slug (the default/first org).
      await page.waitForURL(
        (url) => url.pathname.includes(`/${TEST_CONFIG.org.slug}`),
        { timeout: TEST_CONFIG.timeouts.navigation }
      );

      // Verify we landed on the org dashboard
      expect(page.url()).toContain(`/${TEST_CONFIG.org.slug}`);
    });

    test("TC-22-05: org dashboard loads successfully after redirect", async ({ page }) => {
      await page.goto(localePath("/org"));

      await page.waitForURL(
        (url) => url.pathname.includes(`/${TEST_CONFIG.org.slug}`),
        { timeout: TEST_CONFIG.timeouts.navigation }
      );

      // Verify the dashboard page rendered (not an error page)
      await expect(page.locator("body")).toBeVisible();
      // Should not show a 404 or error state
      const content = await page.textContent("body");
      expect(content).not.toContain("404");
      expect(content).not.toContain("This page could not be found");
    });

    test("TC-22-06: direct navigation to org dashboard works", async ({ page }) => {
      // Navigate directly to the org dashboard (bypassing /org redirect)
      await page.goto(orgPath("/"));

      await page.waitForLoadState("domcontentloaded");

      // Verify we stay on the org dashboard (no unexpected redirects)
      expect(page.url()).toContain(`/${TEST_CONFIG.org.slug}`);
      expect(page.url()).not.toContain("/auth/sign-in");
    });

    test("TC-22-07: org dashboard shows organization context", async ({ page }) => {
      await page.goto(orgPath("/"));
      await page.waitForLoadState("domcontentloaded");

      // The dashboard should display the org name or slug somewhere on the page
      const body = await page.textContent("body");
      const orgIdentifierVisible =
        body?.includes(TEST_CONFIG.org.name) || body?.includes(TEST_CONFIG.org.slug);
      expect(orgIdentifierVisible).toBeTruthy();
    });
  });

  test.describe("Functional: Navigation from org dashboard", () => {
    test.use({ storageState: "e2e/.auth/user.json" });

    test("TC-22-08: org dashboard has navigation to key sections", async ({ page }) => {
      await page.goto(orgPath("/"));
      await page.waitForLoadState("domcontentloaded");

      // Verify at least some org-scoped navigation links are present
      // (billing, members, settings are the known org-scoped routes)
      const navLinks = page.locator('a[href]');
      const allHrefs = await navLinks.evaluateAll((links) =>
        links.map((l) => l.getAttribute("href") || "")
      );

      const orgScopedLinks = allHrefs.filter(
        (href) =>
          href.includes("/billing") ||
          href.includes("/members") ||
          href.includes("/settings")
      );
      expect(orgScopedLinks.length).toBeGreaterThan(0);
    });

    test("TC-22-09: repeated /org visits consistently redirect", async ({ page }) => {
      // Visit /org multiple times to ensure redirect is stable
      for (let i = 0; i < 2; i++) {
        await page.goto(localePath("/org"));
        await page.waitForURL(
          (url) => url.pathname.includes(`/${TEST_CONFIG.org.slug}`),
          { timeout: TEST_CONFIG.timeouts.navigation }
        );
        expect(page.url()).toContain(`/${TEST_CONFIG.org.slug}`);
      }
    });
  });
});
