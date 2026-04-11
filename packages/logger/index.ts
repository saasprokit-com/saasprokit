/**
 * @repo/logger - Structured logging with Pino
 *
 * Server-side usage: import { logger, createRequestLogger } from "@repo/logger/server"
 * Client-side usage: import { logger } from "@repo/logger/client"
 *
 * NOTE: Do not import from the root. Always use explicit server or client exports.
 */

// This file should not re-export server code to avoid bundling pino in browser
export {};
