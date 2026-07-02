import { database } from "@repo/database";
import type Stripe from "stripe";

const WEBHOOK_PROVIDER = "stripe";
const PRISMA_UNIQUE_VIOLATION = "P2002";

/**
 * Atomically claim a Stripe webhook event so a hook's side effects run at most
 * once. Stripe delivers events at least once and retries on failure, so the
 * same `event.id` can arrive repeatedly (and concurrently). The `@better-auth/
 * stripe` plugin only deduplicates the subscription-CREATE path, so the
 * notification side effects in the lifecycle hooks would otherwise fire on
 * every redelivery.
 *
 * The unique `(provider, eventId)` constraint on `webhook_event` is the lock:
 * the first insert wins; concurrent or duplicate inserts hit the constraint and
 * are reported as already-processed. Each wired Stripe event type maps to a
 * single lifecycle hook, so `(provider, eventId)` uniqueness is sufficient.
 *
 * @returns `true` if this call claimed the event (the caller should proceed),
 *   `false` if it was already processed (the caller should skip).
 *
 * Note: the claim is recorded before the side effect runs, so a best-effort
 * notification that fails afterward is not retried — an acceptable tradeoff for
 * lifecycle emails. Switch to a two-phase `processing` → `processed` write if a
 * hook ever performs a side effect that must not be lost.
 */
export async function claimWebhookEvent(event: Stripe.Event): Promise<boolean> {
  try {
    await database.webhookEvent.create({
      data: {
        provider: WEBHOOK_PROVIDER,
        eventId: event.id,
        eventType: event.type,
        data: JSON.stringify(event),
        status: "processed",
        processedAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    if ((error as { code?: string })?.code === PRISMA_UNIQUE_VIOLATION) {
      return false;
    }
    throw error;
  }
}
