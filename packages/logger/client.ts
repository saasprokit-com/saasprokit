"use client";

/**
 * Client-side logger for browser environments
 *
 * Provides a structured logging interface similar to server logger
 * but uses browser console methods. Works in development and production.
 *
 * @example
 * ```typescript
 * import { logger } from "@repo/logger/client";
 *
 * logger.info("Page loaded", { pathname: "/dashboard" });
 * logger.error("Failed to fetch data", { error: error.message });
 * logger.warn("Unsupported browser feature", { feature: "WebGL" });
 * ```
 */

type LogLevel = "debug" | "info" | "warn" | "error";
type LogData = Record<string, unknown>;

interface LogEntry {
  data?: LogData;
  level: string;
  message: string;
  timestamp: string;
}

function formatLogEntry(
  level: LogLevel,
  message: string,
  data?: LogData
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    ...(data && { data }),
  };
}

function log(level: LogLevel, message: string, data?: LogData) {
  const entry = formatLogEntry(level, message, data);

  // biome-ignore lint/suspicious/noConsole: Intentional logging via console
  const consoleMethod = console[
    level as keyof typeof console
  ] as typeof console.log;

  if (data) {
    consoleMethod(
      `%c[${entry.level}]%c ${message}`,
      "color: #888; font-weight: bold;",
      "color: inherit;",
      entry.data
    );
  } else {
    consoleMethod(
      `%c[${entry.level}]%c ${message}`,
      "color: #888; font-weight: bold;",
      "color: inherit;"
    );
  }

  // Store in sessionStorage for debugging (max 10 entries to avoid bloat)
  if (typeof window !== "undefined" && typeof sessionStorage !== "undefined") {
    try {
      const logs = JSON.parse(
        sessionStorage.getItem("app_logs") || "[]"
      ) as LogEntry[];
      logs.push(entry);
      if (logs.length > 10) {
        logs.shift();
      }
      sessionStorage.setItem("app_logs", JSON.stringify(logs));
    } catch {
      // Fail silently if sessionStorage is unavailable
    }
  }
}

/**
 * Client-side logger instance
 * Use for logging in React components and client-side operations
 */
export const logger = {
  /**
   * Log informational messages
   * @example logger.info("User navigated to dashboard")
   */
  info: (message: string, data?: LogData) => log("info", message, data),

  /**
   * Log debug messages (development-focused)
   * @example logger.debug("Form values updated", { name: "John", email: "john@example.com" })
   */
  debug: (message: string, data?: LogData) => log("debug", message, data),

  /**
   * Log warning messages for potentially problematic situations
   * @example logger.warn("API response slow", { duration: 5000 })
   */
  warn: (message: string, data?: LogData) => log("warn", message, data),

  /**
   * Log error messages
   * @example logger.error("Failed to fetch user data", { status: 404 })
   */
  error: (message: string, data?: LogData) => log("error", message, data),
};
