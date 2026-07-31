import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["scripts/index.ts"],
  outDir: "dist",
  format: ["esm"],
  banner: { js: "#!/usr/bin/env node" },
});
