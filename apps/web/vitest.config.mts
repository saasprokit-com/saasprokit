import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    // Unit tests only — e2e/**/*.spec.ts files are Playwright specs
    include: ["**/*.test.{ts,tsx}"],
    // Build output re-copies source tests; without this they run 2-3x
    exclude: ["**/node_modules/**", "**/.next/**", "**/.open-next/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./"),
      "@repo": path.resolve(import.meta.dirname, "../../packages"),
    },
  },
});
