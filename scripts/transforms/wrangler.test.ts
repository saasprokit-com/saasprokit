import { describe, expect, it } from "vitest";
import { customizeWrangler } from "./wrangler";

const WRANGLER = `{
  // Worker name
  "name": "saasprokit-web",
  "main": ".open-next/worker.js",
  "services": [
    { "binding": "WORKER_SELF_REFERENCE", "service": "saasprokit-web" }
  ],
  // Create with: wrangler r2 bucket create saasprokit-web-cache
  "r2_buckets": [
    { "binding": "NEXT_INC_CACHE_R2_BUCKET", "bucket_name": "saasprokit-web-cache" }
  ],
  "vars": {
    "AWS_S3_BUCKET": "saasprokit-uploads"
  },
  "env": {
    "demo": {
      "name": "saasprokit-web",
      "routes": [{ "pattern": "multi-tenant.saasprokit.com", "custom_domain": true }]
    }
  }
}`;

describe("customizeWrangler", () => {
  it("removes the maintainer demo env block", () => {
    const out = customizeWrangler(WRANGLER, "acme");
    expect(out).not.toContain('"env"');
    expect(out).not.toContain("multi-tenant.saasprokit.com");
  });

  it("rebrands worker, service, buckets — including in comments", () => {
    const out = customizeWrangler(WRANGLER, "acme");
    expect(out).toContain('"name": "acme-web"');
    expect(out).toContain('"service": "acme-web"');
    expect(out).toContain('"bucket_name": "acme-web-cache"');
    expect(out).toContain('"AWS_S3_BUCKET": "acme-uploads"');
    expect(out).toContain("wrangler r2 bucket create acme-web-cache");
    expect(out).not.toContain("saasprokit");
  });

  it("keeps comments", () => {
    expect(customizeWrangler(WRANGLER, "acme")).toContain("// Worker name");
  });
});
