import { database } from "@repo/database";
import type Stripe from "stripe";

const WEBHOOK_PROVIDER = "stripe";
const PRISMA_UNIQUE_VIOLATION = "P2002";

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
