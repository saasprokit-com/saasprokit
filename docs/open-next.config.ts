import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

// Cloudflare-only file: R2-backed incremental cache so prerendered pages and
// route handlers survive isolate recycling. Path-based ISR only — adopting
// revalidateTag would additionally need a tag-cache override (D1 or Durable
// Object).
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});
