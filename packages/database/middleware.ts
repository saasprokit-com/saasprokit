import { Prisma } from "./generated/client/client";

const SLOW_QUERY_THRESHOLD_MS = 100;
const ARGS_PREVIEW_LENGTH = 200;

/**
 * Query logging extension for Prisma v7
 * Logs slow queries (>100ms) and query errors for monitoring.
 * Usage: client.$extends(queryLoggingExtension)
 */
export const queryLoggingExtension = Prisma.defineExtension({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const start = Date.now();

        try {
          const result = await query(args);
          const duration = Date.now() - start;

          if (duration > SLOW_QUERY_THRESHOLD_MS) {
            const argsPreview = JSON.stringify(args).slice(
              0,
              ARGS_PREVIEW_LENGTH
            );

            // biome-ignore lint/suspicious/noConsole: logging extension intentionally writes to console
            console.warn(
              `[SLOW_QUERY] ${model}.${operation} took ${duration}ms | Args: ${argsPreview}...`
            );
          }

          return result;
        } catch (error) {
          const duration = Date.now() - start;
          const errorMsg =
            error instanceof Error ? error.message : String(error);

          // biome-ignore lint/suspicious/noConsole: logging extension intentionally writes to console
          console.error(
            `[QUERY_ERROR] ${model}.${operation} failed after ${duration}ms | Error: ${errorMsg}`
          );

          throw error;
        }
      },
    },
  },
});
