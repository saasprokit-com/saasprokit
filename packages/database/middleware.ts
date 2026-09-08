import { logger } from "@repo/logger/log";

import { Prisma } from "./generated/client/client";
import { argShape } from "./redact";

interface QueryLoggingOptions {
  thresholdMs: number;
}

export const queryLoggingExtension = ({ thresholdMs }: QueryLoggingOptions) =>
  Prisma.defineExtension({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const start = Date.now();

          try {
            const result = await query(args);
            const duration = Date.now() - start;

            if (duration > thresholdMs) {
              logger.warn("slow query", {
                model: model ?? "raw",
                operation,
                durationMs: duration,
                argShape: argShape(args),
              });
            }

            return result;
          } catch (error) {
            logger.error("query failed", {
              model: model ?? "raw",
              operation,
              durationMs: Date.now() - start,
              argShape: argShape(args),
              error: error instanceof Error ? error.message : String(error),
            });

            throw error;
          }
        },
      },
    },
  });
