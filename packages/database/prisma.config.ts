import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// This file configures the Prisma CLI (migrations, db push, studio).
// The datasource URL is used by CLI tools only.
// Runtime connections use the adapter in index.ts / nest.ts.

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // DIRECT_URL (optional): migrations need a direct TCP endpoint when
    // DATABASE_URL points at a pooled/serverless proxy (e.g. Neon -pooler).
    // Prisma's env() throws on missing vars, so the optional one uses process.env.
    url: process.env.DIRECT_URL ?? env("DATABASE_URL"),
  },
});
