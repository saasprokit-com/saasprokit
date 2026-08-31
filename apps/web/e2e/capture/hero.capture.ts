import { expect, type Page, test } from "@playwright/test";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "Password@saaspro";
const PRIMARY_ORG = "acme-corp";
const SECONDARY_ORG = "enterprise-inc";

const BEAT = 4500;
const HOLD = 1400;

const SEED_HINT =
  "Seeded admin@example.com not found — run: pnpm --filter @repo/database db:seed";

const PRIMARY_ORG_RE = /Acme Corporation/i;
const SECONDARY_ORG_RE = /Enterprise Inc/i;
const INVITE_MEMBER_RE = /invite member/i;
const OPEN_MENU_RE = /open menu/i;
const IMPERSONATE_RE = /impersonate/i;
const ADMIN_DASHBOARD_RE = /admin dashboard/i;

async function signInAsSeededAdmin(page: Page): Promise<void> {
  const response = await page.request.post("/api/auth/sign-in/email", {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    failOnStatusCode: false,
  });
  expect(response.ok(), SEED_HINT).toBe(true);
}

async function openInviteDialog(page: Page) {
  const dialog = page.getByRole("dialog", { name: INVITE_MEMBER_RE });
  await expect(async () => {
    await page.getByRole("button", { name: INVITE_MEMBER_RE }).click();
    await expect(dialog).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15_000 });
  return dialog;
}

test.describe("Hero video capture", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("zero to running SaaS", async ({ page }) => {
    test.setTimeout(180_000);
    await signInAsSeededAdmin(page);

    const switcher = page.getByRole("button", { name: PRIMARY_ORG_RE });

    await page.goto(`/${PRIMARY_ORG}`);
    await expect(switcher).toBeVisible();
    await page.waitForTimeout(BEAT);

    await switcher.click();
    await expect(page.getByText("Workspaces")).toBeVisible();
    await page.waitForTimeout(HOLD);
    await page.getByRole("menuitem", { name: SECONDARY_ORG_RE }).click();
    await page.waitForURL(new RegExp(`/${SECONDARY_ORG}`), { timeout: 15_000 });
    await page.waitForTimeout(BEAT);

    await page.goto(`/${PRIMARY_ORG}/members`);
    await expect(page.locator("tbody")).toBeVisible();
    await page.waitForTimeout(HOLD);
    await openInviteDialog(page);
    await page.waitForTimeout(BEAT);
    await page.keyboard.press("Escape");

    await page.goto(`/${PRIMARY_ORG}/billing`);
    await expect(page.locator("text=Current Plan").first()).toBeVisible();
    await page.waitForTimeout(HOLD);
    const billingSwitch = page
      .locator("[role='switch'], [data-slot='switch']")
      .first();
    await billingSwitch.scrollIntoViewIfNeeded();
    await billingSwitch.click();
    await page.waitForTimeout(BEAT);

    await page.goto("/en/admin");
    await expect(page.getByText(ADMIN_DASHBOARD_RE)).toBeVisible();
    await page.waitForTimeout(BEAT);

    await page.goto("/en/admin/users");
    await expect(page.getByRole("table")).toBeVisible();
    await page.waitForTimeout(HOLD);
    await page.getByRole("button", { name: OPEN_MENU_RE }).first().click();
    await expect(
      page.getByRole("menuitem", { name: IMPERSONATE_RE })
    ).toBeVisible();
    await page.waitForTimeout(BEAT);
  });
});
