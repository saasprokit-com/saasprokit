import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/client/client";
import { keys } from "./keys";
import { queryLoggingExtension } from "./middleware";

// Validated environment variables
const env = keys();

// SWAP THIS FUNCTION TO CHANGE DEPLOYMENT TARGET:
// - Local / VPS / Docker: PrismaPg (current — standard TCP)
// - Cloudflare / Vercel Edge: swap to PrismaNeon from @prisma/adapter-neon
//   return new PrismaNeon({ connectionString: env.DATABASE_URL })
function createAdapter() {
  return new PrismaPg({ connectionString: env.DATABASE_URL });
}

function createDatabaseClient() {
  const client = new PrismaClient({
    adapter: createAdapter(),
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  return client.$extends(queryLoggingExtension);
}

const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof createDatabaseClient>;
};

export const database = globalForPrisma.prisma || createDatabaseClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = database;
}

export * from "./generated/client/client";
