import { expect, localePath, test } from "../fixtures/fixtures";

test.use({ storageState: { cookies: [], origins: [] } });

test("Should see an error card with a homepage link When the invite token is invalid", async ({
  page,
}) => {
  await page.goto(localePath("/invite/nonexistent-token-xyz"));
  await expect(page.getByText(/invalid invite link/i).first()).toBeVisible();

  const link = page.getByRole("link", { name: /go to homepage/i });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "/");
});
