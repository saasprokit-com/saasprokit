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
    url: env("DATABASE_URL"),
  },
});
