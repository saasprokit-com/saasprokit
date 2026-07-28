import { beforeEach, describe, expect, it, vi } from "vitest";

const { retrieve, findFirst } = vi.hoisted(() => ({
  retrieve: vi.fn(),
  findFirst: vi.fn(),
}));

// `server-only` throws when imported from a non-server environment. Vitest is
// a Node runtime, so we stub it out for tests of server-only modules.
vi.mock("server-only", () => ({}));

vi.mock("@repo/auth/stripe-client", () => ({
  requireStripeClient: () => ({ checkout: { sessions: { retrieve } } }),
}));

vi.mock("@repo/database", () => ({
  database: { subscription: { findFirst } },
}));

import { verifyCheckoutSession } from "./checkout-queries";

const ORG_ID = "org_1";
const SESSION_ID = "cs_test_1";

beforeEach(() => {
  retrieve.mockReset();
  findFirst.mockReset();
});

describe("verifyCheckoutSession", () => {
  it("returns missing_session when sessionId is undefined", async () => {
    const result = await verifyCheckoutSession(undefined, ORG_ID);
    expect(result).toEqual({ ok: false, reason: "missing_session" });
    expect(retrieve).not.toHaveBeenCalled();
  });

  it("returns stripe_error when Stripe throws", async () => {
    retrieve.mockRejectedValue(new Error("network"));
    const result = await verifyCheckoutSession(SESSION_ID, ORG_ID);
    expect(result).toEqual({ ok: false, reason: "stripe_error" });
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("returns not_paid when payment_status is unpaid", async () => {
    retrieve.mockResolvedValue({
      payment_status: "unpaid",
      status: "complete",
    });
    const result = await verifyCheckoutSession(SESSION_ID, ORG_ID);
    expect(result).toEqual({ ok: false, reason: "not_paid" });
  });

  it("returns not_paid when session is paid but status is not complete", async () => {
    retrieve.mockResolvedValue({ payment_status: "paid", status: "open" });
    const result = await verifyCheckoutSession(SESSION_ID, ORG_ID);
    expect(result).toEqual({ ok: false, reason: "not_paid" });
  });

  it("returns wrong_org when no Subscription row matches this org", async () => {
    retrieve.mockResolvedValue({
      payment_status: "paid",
      status: "complete",
      subscription: "sub_1",
      customer: "cus_1",
    });
    findFirst.mockResolvedValue(null);
    const result = await verifyCheckoutSession(SESSION_ID, ORG_ID);
    expect(result).toEqual({ ok: false, reason: "wrong_org" });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ referenceId: ORG_ID }),
      })
    );
  });

  it("returns wrong_org when session has neither subscription nor customer ids", async () => {
    retrieve.mockResolvedValue({
      payment_status: "paid",
      status: "complete",
      subscription: null,
      customer: null,
    });
    findFirst.mockResolvedValue(null);
    const result = await verifyCheckoutSession(SESSION_ID, ORG_ID);
    expect(result).toEqual({ ok: false, reason: "wrong_org" });
  });

  it("accepts no_payment_required as paid", async () => {
    retrieve.mockResolvedValue({
      payment_status: "no_payment_required",
      status: "complete",
      subscription: "sub_1",
    });
    findFirst.mockResolvedValue({ plan: "pro" });
    const result = await verifyCheckoutSession(SESSION_ID, ORG_ID);
    expect(result).toEqual({ ok: true, planName: "pro" });
  });

  it("returns ok=true on paid + complete + matching subscription id", async () => {
    retrieve.mockResolvedValue({
      payment_status: "paid",
      status: "complete",
      subscription: "sub_1",
      customer: "cus_1",
    });
    findFirst.mockResolvedValue({ plan: "enterprise" });
    const result = await verifyCheckoutSession(SESSION_ID, ORG_ID);
    expect(result).toEqual({ ok: true, planName: "enterprise" });
  });

  it("extracts ids from expanded objects on the Stripe session", async () => {
    retrieve.mockResolvedValue({
      payment_status: "paid",
      status: "complete",
      subscription: { id: "sub_1" },
      customer: { id: "cus_1" },
    });
    findFirst.mockResolvedValue({ plan: "pro" });
    const result = await verifyCheckoutSession(SESSION_ID, ORG_ID);
    expect(result).toEqual({ ok: true, planName: "pro" });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { stripeSubscriptionId: "sub_1" },
            { stripeCustomerId: "cus_1" },
          ]),
        }),
      })
    );
  });
});
