import "server-only";

import { database, Prisma } from "@repo/database";
import { createRequestLogger } from "@repo/logger/server";

const logger = createRequestLogger({
  action: "webhookIdempotency",
});

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 60_000; // 1 minute between retries

export type WebhookEventPayload = {
  id: string;
  type: string;
  created: number;
  data: Record<string, unknown>;
  [key: string]: unknown;
};

/**
 * CRITICAL: Check if webhook event has already been processed
 * Prevents duplicate processing of Stripe webhook retries
 *
 * Uses a create-first strategy: attempts to insert the record, relying on the
 * database unique constraint on (provider, eventId) to resolve concurrent
 * requests. If a P2002 (unique violation) occurs, another request already
 * claimed this event — we fall through to the existing-record logic.
 */
export async function checkWebhookIdempotency(
  provider: string,
  eventId: string,
  eventType: string
) {
  try {
    // Attempt to create the record first — the DB unique constraint on
    // (provider, eventId) guarantees only one request wins under concurrency.
    const created = await database.webhookEvent.create({
      data: {
        provider,
        eventId,
        eventType,
        status: "pending",
        data: "{}",
      },
    });

    return {
      isNew: true,
      shouldProcess: true,
      existingRecord: null,
      recordId: created.id,
    };
  } catch (error) {
    // P2002 = unique constraint violation — another request already created
    // the record. Fall through to check the existing record's status.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return handleExistingEvent(provider, eventId, eventType);
    }

    logger.error(
      {
        provider,
        eventId,
        err: error instanceof Error ? error : new Error(String(error)),
      },
      "Error checking webhook idempotency"
    );

    throw error;
  }
}

async function handleExistingEvent(
  provider: string,
  eventId: string,
  eventType: string
) {
  const existing = await database.webhookEvent.findUnique({
    where: {
      provider_eventId: { provider, eventId },
    },
  });

  if (!existing) {
    // Should not happen — the P2002 proves a record exists. Defensive fallback.
    logger.error(
      { provider, eventId },
      "Record not found after unique constraint violation"
    );
    throw new Error(`Webhook event record disappeared: ${provider}/${eventId}`);
  }

  // Event already processed successfully
  if (existing.status === "processed") {
    logger.info(
      {
        provider,
        eventId,
        eventType,
        processedAt: existing.processedAt,
      },
      "Webhook event already processed, skipping"
    );
    return {
      isNew: false,
      shouldProcess: false,
      existingRecord: existing,
      recordId: existing.id,
    };
  }

  // Event failed before — check if should retry
  if (existing.status === "failed") {
    const canRetry =
      existing.attempts < MAX_RETRY_ATTEMPTS &&
      (!existing.nextRetryAt || existing.nextRetryAt <= new Date());

    if (canRetry) {
      logger.info(
        {
          provider,
          eventId,
          attempts: existing.attempts,
        },
        "Retrying failed webhook event"
      );

      await database.webhookEvent.update({
        where: { id: existing.id },
        data: {
          status: "pending",
          attempts: existing.attempts + 1,
        },
      });

      return {
        isNew: false,
        shouldProcess: true,
        existingRecord: existing,
        recordId: existing.id,
      };
    }

    logger.warn(
      {
        provider,
        eventId,
        attempts: existing.attempts,
        maxAttempts: MAX_RETRY_ATTEMPTS,
      },
      "Max retry attempts exceeded for webhook event"
    );

    return {
      isNew: false,
      shouldProcess: false,
      existingRecord: existing,
      recordId: existing.id,
    };
  }

  // Event is currently being processed by another request — skip
  logger.warn(
    { provider, eventId },
    "Webhook event currently being processed, ignoring duplicate"
  );

  return {
    isNew: false,
    shouldProcess: false,
    existingRecord: existing,
    recordId: existing.id,
  };
}

/**
 * Mark webhook event as successfully processed
 */
export async function markWebhookProcessed(recordId: string) {
  try {
    await database.webhookEvent.update({
      where: { id: recordId },
      data: {
        status: "processed",
        processedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error(
      {
        recordId,
        err: error instanceof Error ? error : new Error(String(error)),
      },
      "Error marking webhook as processed"
    );
    throw error;
  }
}

/**
 * Mark webhook event as failed and schedule retry
 */
export async function markWebhookFailed(
  recordId: string,
  error: string,
  attempts: number
) {
  try {
    const nextRetryAt = new Date(Date.now() + RETRY_BACKOFF_MS);

    await database.webhookEvent.update({
      where: { id: recordId },
      data: {
        status: "failed",
        error,
        nextRetryAt: attempts < MAX_RETRY_ATTEMPTS ? nextRetryAt : null,
      },
    });
  } catch (err) {
    logger.error(
      {
        recordId,
        err: err instanceof Error ? err : new Error(String(err)),
      },
      "Error marking webhook as failed"
    );
    throw err;
  }
}

/**
 * Store webhook event full data for audit/replay
 */
export async function storeWebhookEventData(
  recordId: string,
  eventData: WebhookEventPayload
) {
  try {
    await database.webhookEvent.update({
      where: { id: recordId },
      data: {
        data: JSON.stringify(eventData),
      },
    });
  } catch (error) {
    logger.error(
      {
        recordId,
        err: error instanceof Error ? error : new Error(String(error)),
      },
      "Error storing webhook event data"
    );
    throw error;
  }
}
