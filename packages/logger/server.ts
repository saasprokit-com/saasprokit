type LogData = Record<string, unknown>;

function log(
  level: "info" | "warn" | "error" | "debug",
  obj: unknown,
  msg?: string
) {
  const timestamp = new Date().toISOString();
  const label = level.toUpperCase();

  if (process.env.NODE_ENV === "production") {
    // Structured JSON for log aggregation
    const entry =
      typeof obj === "object" && obj !== null ? obj : { value: obj };
    console[level](JSON.stringify({ timestamp, level: label, msg, ...entry }));
  } else {
    // Human-readable for development
    console[level](`[${label}] ${msg ?? ""}`, obj);
  }
}

const createChildLogger = (parentCtx: LogData) => ({
  info: (obj: unknown, msg?: string) =>
    log(
      "info",
      {
        ...parentCtx,
        ...(typeof obj === "object" && obj !== null ? obj : { value: obj }),
      },
      msg
    ),
  error: (obj: unknown, msg?: string) =>
    log(
      "error",
      {
        ...parentCtx,
        ...(typeof obj === "object" && obj !== null ? obj : { value: obj }),
      },
      msg
    ),
  warn: (obj: unknown, msg?: string) =>
    log(
      "warn",
      {
        ...parentCtx,
        ...(typeof obj === "object" && obj !== null ? obj : { value: obj }),
      },
      msg
    ),
  debug: (obj: unknown, msg?: string) => {
    if (process.env.NODE_ENV !== "production") {
      log(
        "debug",
        {
          ...parentCtx,
          ...(typeof obj === "object" && obj !== null ? obj : { value: obj }),
        },
        msg
      );
    }
  },
  child: (ctx: unknown) =>
    createChildLogger({ ...parentCtx, ...(ctx as LogData) }),
});

const simpleLogger = {
  info: (obj: unknown, msg?: string) => log("info", obj, msg),
  error: (obj: unknown, msg?: string) => log("error", obj, msg),
  warn: (obj: unknown, msg?: string) => log("warn", obj, msg),
  debug: (obj: unknown, msg?: string) => {
    if (process.env.NODE_ENV !== "production") {
      log("debug", obj, msg);
    }
  },
  child: (ctx: unknown) => createChildLogger(ctx as LogData),
};

/**
 * Server-side logger instance for Node.js backend code
 *
 * In development: Pretty-printed, human-readable output
 * In production: Structured JSON output for log aggregation
 *
 * NOTE: Using simple console-based logger to avoid bundling pino
 * which has problematic transitive dependencies with test files
 *
 * @example
 * ```typescript
 * import { logger } from "@repo/logger/server";
 *
 * logger.info("User logged in", { userId: "123", email: "user@example.com" });
 * logger.error("Database connection failed", new Error("ECONNREFUSED"));
 * logger.warn("Rate limit approaching", { remaining: 5, limit: 100 });
 * ```
 */
export const logger = simpleLogger;

/**
 * Create a request-scoped logger with automatic context binding
 * Filters out null/undefined values automatically
 * Useful for API routes and server actions
 *
 * @example
 * ```typescript
 * const requestLogger = createRequestLogger({
 *   requestId: headers().get("x-request-id"),
 *   userId: session?.user?.id,
 *   organizationId: org?.id,
 * });
 * requestLogger.info("Processing request");
 * // All fields will be included in subsequent logs
 * ```
 */
export function createRequestLogger(context: {
  requestId?: string | null;
  userId?: string;
  organizationId?: string;
  path?: string;
  action?: string;
  endpoint?: string;
  method?: string;
  [key: string]: unknown;
}) {
  // Filter out null/undefined values
  const cleanContext = Object.fromEntries(
    Object.entries(context).filter(([_, v]) => v != null)
  );

  // Return a logger with child context (returns same logger since we use simple console)
  return logger.child(cleanContext);
}
