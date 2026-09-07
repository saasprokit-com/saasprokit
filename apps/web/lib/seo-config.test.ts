import { createMetadata } from "@repo/seo";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_APP_NAME: "Test App",
    NEXT_PUBLIC_APP_URL: "https://example.com",
  },
}));

import { siteConfig } from "./seo-config";

describe("seo-config carries no kit branding", () => {
  it("derives the site name from NEXT_PUBLIC_APP_NAME", () => {
    expect(siteConfig.name).toBe("Test App");
  });

  it("flows the app name into generated metadata instead of a hardcoded brand", () => {
    const metadata = createMetadata(
      { description: siteConfig.description },
      siteConfig
    );

    expect(metadata.title).toEqual({
      default: "Test App",
      template: "%s | Test App",
    });
    expect(metadata.openGraph?.siteName).toBe("Test App");
  });
});
