import { describe, expect, it } from "vitest";
import {
  isAlreadyCancelingError,
  isSubscriptionPendingCancel,
} from "./helpers";
import type { Subscription } from "./types";

function makeSub(overrides: Partial<Subscription>): Subscription {
  return {
    id: "sub_db_1",
    plan: "pro",
    referenceId: "org_1",
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: "sub_1",
    status: "active",
    periodStart: null,
    periodEnd: null,
    trialStart: null,
    trialEnd: null,
    cancelAtPeriodEnd: null,
    cancelAt: null,
    seats: 1,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}

describe("isSubscriptionPendingCancel", () => {
  it("is true when cancelAtPeriodEnd is the legacy boolean true", () => {
    expect(isSubscriptionPendingCancel(makeSub({ cancelAtPeriodEnd: true }))).toBe(
      true
    );
  });

  // Regression: Stripe's newer API schedules cancellation via `cancelAt` while
  // `cancelAtPeriodEnd` stays false. The old code checked only the boolean, so
  // the Cancel button kept showing and re-triggered a 400 on every click.
  it("is true when only cancelAt is set (cancelAtPeriodEnd false)", () => {
    expect(
      isSubscriptionPendingCancel(
        makeSub({ cancelAtPeriodEnd: false, cancelAt: new Date("2026-06-28") })
      )
    ).toBe(true);
  });

  it("is false when neither field indicates cancellation", () => {
    expect(
      isSubscriptionPendingCancel(
        makeSub({ cancelAtPeriodEnd: false, cancelAt: null })
      )
    ).toBe(false);
  });

  it("is false for null/undefined subscriptions", () => {
    expect(isSubscriptionPendingCancel(null)).toBe(false);
    expect(isSubscriptionPendingCancel(undefined)).toBe(false);
  });
});

describe("isAlreadyCancelingError", () => {
  it("detects Stripe's already-canceling message", () => {
    expect(
      isAlreadyCancelingError(
        "The subscription sub_1 is already set to be canceled at period end."
      )
    ).toBe(true);
  });

  it("does not match unrelated errors or missing messages", () => {
    expect(isAlreadyCancelingError("No active subscription")).toBe(false);
    expect(isAlreadyCancelingError(undefined)).toBe(false);
  });
});
