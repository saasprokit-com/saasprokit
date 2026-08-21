import { logger } from "@repo/logger/server";

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
              logger.warn(
                {
                  model: model ?? "raw",
                  operation,
                  durationMs: duration,
                  argShape: argShape(args),
                },
                "slow query"
              );
            }

            return result;
          } catch (error) {
            logger.error(
              {
                model: model ?? "raw",
                operation,
                durationMs: Date.now() - start,
                argShape: argShape(args),
                error: error instanceof Error ? error.message : String(error),
              },
              "query failed"
            );

            throw error;
          }
        },
      },
    },
  });
