import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/server";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  processStripeEvent,
  validateAndConstructEvent,
} from "@/lib/billing/webhook-handlers";
import {
  checkWebhookIdempotency,
  markWebhookFailed,
  markWebhookProcessed,
  storeWebhookEventData,
  type WebhookEventPayload,
} from "@/lib/infrastructure/webhook-idempotency";

const logger = createRequestLogger({
  endpoint: "/api/stripe/webhook",
  method: "POST",
});

const RECEIVED = NextResponse.json({ received: true });

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

function getAttempts(
  check: Awaited<ReturnType<typeof checkWebhookIdempotency>>
): number {
  return check.isNew ? 1 : (check.existingRecord?.attempts ?? 1);
}

/**
 * Safely mark an idempotency record as processed.
 * If the DB write fails, log but don't throw — processing already succeeded.
 */
async function safeMarkProcessed(
  recordId: string,
  eventId: string
): Promise<void> {
  try {
    await markWebhookProcessed(recordId);
  } catch (error) {
    logger.error(
      { recordId, eventId, err: toError(error) },
      "Failed to mark webhook as processed — processing already completed"
    );
  }
}

/**
 * Safely mark an idempotency record as failed.
 * If the DB write fails, log but don't throw — we're already in an error path.
 */
async function safeMarkFailed(
  recordId: string,
  eventId: string,
  reason: string,
  attempts: number
): Promise<void> {
  try {
    await markWebhookFailed(recordId, reason, attempts);
  } catch (error) {
    logger.error(
      { recordId, eventId, err: toError(error) },
      "Failed to mark webhook as failed — record may be stuck in pending"
    );
  }
}

/**
 * Process a webhook event after idempotency has been claimed.
 *
 * Guarantees: the idempotency record is always transitioned out of "pending"
 * (to "processed" or "failed"), regardless of whether processing succeeds.
 */
async function processEvent(
  request: Request,
  event: Stripe.Event,
  body: string,
  idempotencyCheck: Awaited<ReturnType<typeof checkWebhookIdempotency>>
): Promise<Response> {
  const recordId = idempotencyCheck.recordId;
  const attempts = getAttempts(idempotencyCheck);

  try {
    const eventPayload: WebhookEventPayload = {
      id: event.id ?? "",
      type: event.type ?? "",
      created: event.created ?? 0,
      data: (event.data ?? {}) as unknown as Record<string, unknown>,
    };
    await storeWebhookEventData(recordId, eventPayload);

    // Handle custom events (email notifications)
    await processStripeEvent(event);

    // Let Better Auth handle the webhook (subscription sync, etc.)
    const authResponse = await auth.handler(
      new Request(request.url, {
        method: "POST",
        headers: request.headers,
        body,
      })
    );

    if (authResponse.ok) {
      await safeMarkProcessed(recordId, event.id);
      logger.info(
        { eventId: event.id, eventType: event.type },
        "Webhook processed successfully"
      );
      return RECEIVED;
    }

    // Auth handler returned non-2xx — mark as failed for our own retry logic
    await markWebhookFailed(
      recordId,
      `Auth handler returned ${authResponse.status}`,
      attempts
    );
    logger.error(
      {
        eventId: event.id,
        eventType: event.type,
        authStatus: authResponse.status,
      },
      "Auth handler failed, webhook marked for retry"
    );
    // Return 200 to stop Stripe retries — our idempotency layer handles
    // retries up to MAX_RETRY_ATTEMPTS
    return RECEIVED;
  } catch (processingError) {
    // Mark as failed so it doesn't stay stuck in "pending" forever
    await safeMarkFailed(
      recordId,
      event.id,
      toError(processingError).message,
      attempts
    );
    // Re-throw so the outer catch returns 500 → Stripe retries for transient errors
    throw processingError;
  }
}

async function handleWebhookProcessing(
  request: Request,
  event: Stripe.Event,
  body: string
): Promise<Response> {
  // If this throws (DB down), let it bubble → 500 → Stripe retries.
  // No idempotency record exists yet, so there's nothing to mark as failed.
  const idempotencyCheck = await checkWebhookIdempotency(
    "stripe",
    event.id,
    event.type
  );

  if (!idempotencyCheck.shouldProcess) {
    logger.info(
      { eventId: event.id, eventType: event.type },
      "Webhook already processed or cannot retry, returning success to Stripe"
    );
    return RECEIVED;
  }

  return processEvent(request, event, body, idempotencyCheck);
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    const validation = validateAndConstructEvent(body, signature);
    if (!validation.success) {
      return validation.response;
    }

    return await handleWebhookProcessing(request, validation.event, body);
  } catch (error) {
    logger.error({ err: error }, "Webhook processing failed");
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
