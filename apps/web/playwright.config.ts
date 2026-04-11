import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

export default defineConfig({
  globalSetup: "./e2e/global-setup.ts",
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on",
  },
  projects: [
    // Setup: authenticate user
    {
      name: "auth-setup",
      testMatch: /auth\.setup\.ts/,
    },
    // Setup: create/verify org (depends on auth)
    {
      name: "org-setup",
      testMatch: /org\.setup\.ts/,
      dependencies: ["auth-setup"],
      use: {
        storageState: "e2e/.auth/user.json",
      },
    },
    // Public & auth pages (no auth needed)
    {
      name: "no-auth",
      testMatch: /0[1-8]-.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    // Authenticated pages (account, org, misc)
    {
      name: "chromium",
      testMatch: /(?:09|1[0-9]|2[0-4])-.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["auth-setup", "org-setup"],
    },
    // Topic-based test folders (payment, auth, members, accounts)
    {
      name: "topics",
      testMatch: /(?:payment|auth|members|accounts)\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["auth-setup", "org-setup"],
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
