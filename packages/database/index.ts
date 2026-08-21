import "server-only";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/client/client";
import { keys } from "./keys";
import { queryLoggingExtension } from "./middleware";

// Validated environment variables
const env = keys();

// workerd has no raw TCP, so the pg driver can't run there. CF_BUILD covers the
// Cloudflare build itself, which collects page data under Node — the bundle it
// produces only ever runs on workerd, so it must not reach for pg either.
const isWorkerd =
  (typeof navigator !== "undefined" &&
    navigator.userAgent === "Cloudflare-Workers") ||
  Boolean(process.env.CF_BUILD);

// Adapter is selected per runtime, not per build — the same bundle works on
// Node hosts (Vercel/Docker: TCP pg) and Cloudflare Workers (Neon serverless).
// DATABASE_URL on Workers must be a Neon POOLED (-pooler) endpoint.
function createAdapter() {
  if (isWorkerd) {
    // Neon's WS Pool (not the HTTP driver) — interactive $transaction needs it
    neonConfig.webSocketConstructor = WebSocket;
    // One-shot queries go over HTTP fetch: cheaper per-isolate cold start
    neonConfig.poolQueryViaFetch = true;
    return new PrismaNeon({ connectionString: env.DATABASE_URL });
  }
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

  return client.$extends(
    queryLoggingExtension({ thresholdMs: env.DB_SLOW_QUERY_MS })
  );
}

const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof createDatabaseClient>;
};

export const database = globalForPrisma.prisma || createDatabaseClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = database;
}

export * from "./generated/client/client";
