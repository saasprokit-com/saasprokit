import { expect, orgPath, test } from "../fixtures/fixtures";

test.use({ storageState: "e2e/.auth/user.json" });

test("Should trigger the checkout server action When Upgrade to Pro is clicked", async ({
  page,
}) => {
  await page.goto(orgPath("/billing"));
  const upgradeBtn = page
    .getByRole("button", { name: /upgrade to pro/i })
    .first();
  await expect(upgradeBtn).toBeVisible();

  let actionFired = false;
  const actionPromise = page.waitForRequest((request) => {
    if (request.method() === "POST" && request.headers()["next-action"]) {
      actionFired = true;
      return true;
    }
    return false;
  });

  await upgradeBtn.click();
  await actionPromise.catch(() => undefined);

  expect(actionFired).toBe(true);
});
