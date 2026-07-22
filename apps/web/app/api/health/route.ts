import { database } from "@repo/database";
import { createRequestLogger } from "@repo/logger/server";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

const logger = createRequestLogger({
  endpoint: "/api/health",
  method: "GET",
});

export const dynamic = "force-dynamic"; // Don't cache health checks

// HTTP status codes
const HTTP_OK = 200;
const HTTP_SERVICE_UNAVAILABLE = 503;
const HTTP_INTERNAL_SERVER_ERROR = 500;

interface HealthCheckResponse {
  checks: {
    database: { status: "ok" | "error"; responseTime?: number; error?: string };
    auth: { status: "ok" | "error"; error?: string };
  };
  responseTime: number;
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
}

export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const startTime = Date.now();

  try {
    // Run all checks in parallel
    const [dbCheck, authCheck] = await Promise.all([
      checkDatabase(),
      checkAuth(),
    ]);

    const responseTime = Date.now() - startTime;
    const allHealthy = dbCheck.status === "ok" && authCheck.status === "ok";

    return NextResponse.json(
      {
        status: allHealthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        responseTime,
        checks: {
          database: dbCheck,
          auth: authCheck,
        },
      },
      { status: allHealthy ? HTTP_OK : HTTP_SERVICE_UNAVAILABLE }
    );
  } catch (_error) {
    const responseTime = Date.now() - startTime;
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        responseTime,
        checks: {
          database: { status: "error", error: "Health check exception" },
          auth: { status: "error", error: "Health check exception" },
        },
      },
      { status: HTTP_INTERNAL_SERVER_ERROR }
    );
  }
}

async function checkDatabase(): Promise<{
  status: "ok" | "error";
  responseTime?: number;
  error?: string;
}> {
  const startTime = Date.now();
  try {
    await database.$queryRaw`SELECT 1`;
    return {
      status: "ok",
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * SECURITY: Returns generic error message to avoid information disclosure.
 * Specific missing env vars should not be exposed to external callers
 * as this aids reconnaissance attacks.
 */
function checkAuth(): {
  status: "ok" | "error";
  error?: string;
} {
  try {
    const checks = {
      BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: env.BETTER_AUTH_URL,
    };
    const missing = Object.entries(checks)
      .filter(([, v]) => !v)
      .map(([k]) => k);

    if (missing.length > 0) {
      // SECURITY: Log specific details server-side but return generic error
      logger.error({ missing }, "Health Check: Missing auth configuration");

      return {
        status: "error",
        error: "Authentication service misconfiguration",
      };
    }

    return { status: "ok" };
  } catch (error) {
    // SECURITY: Don't expose error details to external callers
    logger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      "Health Check: Auth check exception"
    );

    return {
      status: "error",
      error: "Authentication service check failed",
    };
  }
}
