import { clearInbox, isMaildevAvailable, waitForEmailLink } from "../helpers/maildev";
import { expect, localePath, TEST_CONFIG, test } from "../fixtures/fixtures";

test.use({ storageState: { cookies: [], origins: [] } });

// Note: the standalone /auth/magic-link error page was removed from the app
// (commit e834862); magic-link now lives only in the sign-in page's tab, so
// there is no failure-state page left to test — the request→click flow below
// is the real coverage.
test("Should sign in When the magic link is requested, emailed, and clicked", async ({
  page,
}) => {
  const available = await isMaildevAvailable();
  test.skip(!available, "Maildev is not available");
  await clearInbox();

  await page.goto(localePath("/auth/sign-in"));
  await page.getByRole("tab", { name: /magic link/i }).click();
  await page
    .getByRole("textbox", { name: /email/i })
    .fill(TEST_CONFIG.user.email);
  await page.getByRole("button", { name: /send magic link/i }).click();

  await expect(
    page.getByRole("heading", { name: /check your email/i })
  ).toBeVisible({ timeout: TEST_CONFIG.timeouts.action });

  const { url: magicLinkUrl } = await waitForEmailLink(
    TEST_CONFIG.user.email,
    "magic-link",
    { subjectContains: "sign in", timeout: TEST_CONFIG.timeouts.navigation }
  );

  await page.goto(magicLinkUrl);
  await page.waitForURL((url) => !url.pathname.includes("/auth/"), {
    timeout: TEST_CONFIG.timeouts.navigation,
  });
  expect(page.url()).not.toContain("/auth/sign-in");
});
