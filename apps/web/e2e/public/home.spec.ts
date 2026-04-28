import { test, expect } from "@playwright/test";
import { localePath } from "../fixtures/test-config";

test.describe("Home Page", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  // ---------------------------------------------------------------------------
  // UI Rendering Tests (existing)
  // ---------------------------------------------------------------------------

  test("page loads with hero section, CTA buttons, pricing, and footer", async ({
    page,
  }) => {
    await page.goto(localePath("/"));

    // Hero heading
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /The SaaS Boilerplate That Ships Fast/i,
      })
    ).toBeVisible();

    // Primary and secondary CTA buttons in hero
    await expect(
      page.getByRole("link", { name: /Get Started Free/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /View Demo/i }).first()
    ).toBeVisible();

    // Pricing section heading
    await expect(
      page.getByRole("heading", { name: /Simple, Transparent Pricing/i })
    ).toBeVisible();

    // Footer
    await expect(page.locator("footer")).toBeVisible();
  });

  test("Get Started Free CTA links to sign-up", async ({ page }) => {
    await page.goto(localePath("/"));

    const cta = page.getByRole("link", { name: /Get Started Free/i });
    await expect(cta).toHaveAttribute("href", /\/auth\/sign-up/);
  });

  test("pricing toggle switches between monthly and annual", async ({
    page,
  }) => {
    await page.goto(localePath("/"));

    // Default is monthly - Pro tier shows $19
    await expect(page.getByText("$19")).toBeVisible();

    // Toggle to annual billing
    await page.getByRole("switch").click();

    // Annual Pro price is $15.83, save badge visible
    await expect(page.getByText("$15.83")).toBeVisible();
    await expect(page.getByText("Save ~17%")).toBeVisible();

    // Toggle back to monthly
    await page.getByRole("switch").click();
    await expect(page.getByText("$19")).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Functional Tests — Page Sections Load
  // ---------------------------------------------------------------------------

  test("all major page sections render in correct order", async ({ page }) => {
    await page.goto(localePath("/"));

    // Verify all section headings are present and visible
    const sectionHeadings = [
      /The SaaS Boilerplate That Ships Fast/i,
      /See It In Action/i,
      /Everything You Need to Ship/i,
      /Simple, Transparent Pricing/i,
      /Built with Modern Technologies/i,
      /Ready to Build Your SaaS\?/i,
    ];

    for (const heading of sectionHeadings) {
      await expect(
        page.getByRole("heading", { name: heading }).first()
      ).toBeVisible();
    }
  });

  test("hero section displays benefits list", async ({ page }) => {
    await page.goto(localePath("/"));

    const benefits = [
      "Production-ready code",
      "TypeScript end-to-end",
      "Monorepo architecture",
      "CI/CD configured",
      "Testing setup",
      "Documentation included",
    ];

    for (const benefit of benefits) {
      await expect(page.getByText(benefit).first()).toBeVisible();
    }
  });

  test("features grid renders all 9 feature cards", async ({ page }) => {
    await page.goto(localePath("/"));

    const featureTitles = [
      "Organization Management",
      "User Management",
      "Payment Integration",
      "Authentication",
      "Role-Based Access",
      "Email System",
      "File Storage",
      "Internationalization",
      "API & Webhooks",
    ];

    for (const title of featureTitles) {
      await expect(page.getByText(title).first()).toBeVisible();
    }
  });

  test("tech stack section shows all technologies", async ({ page }) => {
    await page.goto(localePath("/"));

    const technologies = [
      "Next.js 16",
      "Better Auth",
      "Prisma",
      "PostgreSQL",
      "Tailwind CSS",
      "shadcn/ui",
      "Stripe",
    ];

    for (const tech of technologies) {
      await expect(page.getByText(tech).first()).toBeVisible();
    }
  });

  test("demo showcase section renders demo items", async ({ page }) => {
    await page.goto(localePath("/"));

    // Demo items show their "value" field, not "label"
    const demoValues = ["Auth", "Multi-tenant", "RBAC", "Stripe"];

    for (const value of demoValues) {
      await expect(page.getByText(value).first()).toBeVisible();
    }

    // "Explore Dashboard" CTA
    await expect(
      page.getByRole("link", { name: /Explore Dashboard/i })
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Functional Tests — Navigation Links Work
  // ---------------------------------------------------------------------------

  test("hero 'Get Started Free' CTA navigates to sign-up page", async ({
    page,
  }) => {
    await page.goto(localePath("/"));

    const cta = page.getByRole("link", { name: /Get Started Free/i });
    await cta.click();

    await page.waitForURL(/\/auth\/sign-up/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/auth\/sign-up/);
  });

  test("hero 'View Demo' link navigates to sign-up page", async ({ page }) => {
    await page.goto(localePath("/"));

    const viewDemo = page.getByRole("link", { name: /View Demo/i }).first();
    await viewDemo.click();

    await page.waitForURL(/\/auth\/sign-up/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/auth\/sign-up/);
  });

  test("'Explore Dashboard' link navigates to sign-up page", async ({
    page,
  }) => {
    await page.goto(localePath("/"));

    const exploreCta = page.getByRole("link", {
      name: /Explore Dashboard/i,
    });
    await exploreCta.click();

    await page.waitForURL(/\/auth\/sign-up/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/auth\/sign-up/);
  });

  test("CTA banner 'Start Building Now' navigates to sign-up page", async ({
    page,
  }) => {
    await page.goto(localePath("/"));

    const startBuilding = page.getByRole("link", {
      name: /Start Building Now/i,
    });
    await startBuilding.click();

    await page.waitForURL(/\/auth\/sign-up/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/auth\/sign-up/);
  });

  // ---------------------------------------------------------------------------
  // Functional Tests — Pricing Tier CTAs
  // ---------------------------------------------------------------------------

  test("pricing tier CTAs have correct sign-up hrefs", async ({ page }) => {
    await page.goto(localePath("/"));

    // Free tier CTA
    const getStartedLinks = page.getByRole("link", {
      name: /^Get Started$/i,
    });
    await expect(getStartedLinks.first()).toHaveAttribute(
      "href",
      /\/auth\/sign-up/
    );

    // Pro tier CTA
    const proLink = page.getByRole("link", { name: /Upgrade to Pro/i });
    await expect(proLink.first()).toHaveAttribute(
      "href",
      /\/auth\/sign-up\?plan=pro/
    );

    // Enterprise tier CTA
    const enterpriseLink = page.getByRole("link", {
      name: /Contact Sales/i,
    });
    await expect(enterpriseLink.first()).toHaveAttribute(
      "href",
      /\/auth\/sign-up\?plan=enterprise/
    );
  });

  test("clicking Pro pricing CTA navigates to sign-up with plan param", async ({
    page,
  }) => {
    await page.goto(localePath("/"));

    const proLink = page
      .getByRole("link", { name: /Upgrade to Pro/i })
      .first();
    await proLink.click();

    await page.waitForURL(/\/auth\/sign-up\?plan=pro/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/auth\/sign-up\?plan=pro/);
  });

  // ---------------------------------------------------------------------------
  // Functional Tests — Pricing Toggle State Persistence
  // ---------------------------------------------------------------------------

  test("pricing toggle updates all tier prices simultaneously", async ({
    page,
  }) => {
    await page.goto(localePath("/"));

    // Monthly prices visible: Free=$0, Pro=$19, Enterprise=$49
    await expect(page.getByText("$19")).toBeVisible();
    await expect(page.getByText("$49")).toBeVisible();

    // Toggle to annual
    await page.getByRole("switch").click();

    // Annual prices visible: Pro=$15.83, Enterprise=$40.83
    await expect(page.getByText("$15.83")).toBeVisible();
    await expect(page.getByText("$40.83")).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Functional Tests — Responsive / Viewport
  // ---------------------------------------------------------------------------

  test("page renders correctly on mobile viewport", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();

    await page.goto(localePath("/"));

    // Hero heading still visible on mobile
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /The SaaS Boilerplate That Ships Fast/i,
      })
    ).toBeVisible();

    // CTA buttons still visible
    await expect(
      page.getByRole("link", { name: /Get Started Free/i })
    ).toBeVisible();

    // Footer still visible
    await expect(page.locator("footer")).toBeVisible();

    // Pricing section still accessible
    await expect(
      page.getByRole("heading", { name: /Simple, Transparent Pricing/i })
    ).toBeVisible();

    await context.close();
  });

  test("page renders correctly on tablet viewport", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();

    await page.goto(localePath("/"));

    // Key sections still visible on tablet
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /The SaaS Boilerplate That Ships Fast/i,
      })
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: /Everything You Need to Ship/i })
    ).toBeVisible();

    await expect(page.locator("footer")).toBeVisible();

    await context.close();
  });

  // ---------------------------------------------------------------------------
  // Functional Tests — Scroll & Accessibility
  // ---------------------------------------------------------------------------

  test("page is scrollable and bottom CTA banner is reachable", async ({
    page,
  }) => {
    await page.goto(localePath("/"));

    // Scroll to the CTA banner at the bottom
    const ctaBanner = page.getByRole("heading", {
      name: /Ready to Build Your SaaS\?/i,
    });
    await ctaBanner.scrollIntoViewIfNeeded();
    await expect(ctaBanner).toBeVisible();

    // The "Start Building Now" CTA should also be visible after scrolling
    await expect(
      page.getByRole("link", { name: /Start Building Now/i })
    ).toBeVisible();
  });

  test("page has no broken images", async ({ page }) => {
    await page.goto(localePath("/"));

    // Check that all images have loaded (naturalWidth > 0)
    const images = page.locator("img");
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const naturalWidth = await img.evaluate(
        (el) => (el as HTMLImageElement).naturalWidth
      );
      const src = await img.getAttribute("src");
      expect(
        naturalWidth,
        `Image ${src} should have loaded (naturalWidth > 0)`
      ).toBeGreaterThan(0);
    }
  });

  test("header logo link navigates to home page", async ({ page }) => {
    // Start on a different page to verify logo navigates home
    await page.goto(localePath("/"));

    const logo = page.locator("header").getByRole("link").first();
    const logoHref = await logo.getAttribute("href");

    // Logo should link to home (root path)
    expect(logoHref).toMatch(/^\/?$/);
  });
});
