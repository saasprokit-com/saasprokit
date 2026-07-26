import type { Subscription } from "@repo/database";
import {
  ACTIVE_STATUSES,
  PLAN_NAMES,
  SUBSCRIPTION_STATUS,
} from "@repo/utils/payment";
import { describe, expect, it } from "vitest";
import {
  getCurrentPlan,
  getStatusDisplayText,
  isAlreadyCancelingError,
  isSubscriptionActive,
  isSubscriptionPendingCancel,
} from "./helpers";

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
    canceledAt: null,
    endedAt: null,
    billingInterval: null,
    stripeScheduleId: null,
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

// Entitlement policy (chosen): access is granted while active, in-trial, or in
// Stripe's dunning grace window (past_due), and revoked once retries are
// exhausted (unpaid) or the sub is otherwise not live. These tests pin that
// policy across all 8 Stripe statuses so a future enum/policy change is caught.
const GRANTING_STATUSES = [
  SUBSCRIPTION_STATUS.ACTIVE,
  SUBSCRIPTION_STATUS.TRIALING,
  SUBSCRIPTION_STATUS.PAST_DUE,
];
const REVOKING_STATUSES = [
  SUBSCRIPTION_STATUS.INCOMPLETE,
  SUBSCRIPTION_STATUS.INCOMPLETE_EXPIRED,
  SUBSCRIPTION_STATUS.CANCELED,
  SUBSCRIPTION_STATUS.UNPAID,
  SUBSCRIPTION_STATUS.PAUSED,
];

describe("isSubscriptionActive — entitlement policy across all 8 Stripe statuses", () => {
  it.each(GRANTING_STATUSES)("grants access for %s", (status) => {
    expect(isSubscriptionActive(makeSub({ status }))).toBe(true);
  });

  it.each(REVOKING_STATUSES)("revokes access for %s", (status) => {
    expect(isSubscriptionActive(makeSub({ status }))).toBe(false);
  });

  it("classifies every Stripe status exactly once", () => {
    const classified = [...GRANTING_STATUSES, ...REVOKING_STATUSES].sort();
    const enumerated = Object.values(SUBSCRIPTION_STATUS).sort();
    expect(classified).toEqual(enumerated);
  });

  it("keeps ACTIVE_STATUSES in sync with the granting set", () => {
    expect([...ACTIVE_STATUSES].sort()).toEqual([...GRANTING_STATUSES].sort());
  });

  it("is false when the subscription or status is missing", () => {
    expect(isSubscriptionActive(makeSub({ status: null }))).toBe(false);
    expect(isSubscriptionActive(null)).toBe(false);
    expect(isSubscriptionActive(undefined)).toBe(false);
  });
});

describe("getCurrentPlan", () => {
  it("returns the plan during the past_due grace window", () => {
    expect(
      getCurrentPlan(
        makeSub({ plan: "enterprise", status: SUBSCRIPTION_STATUS.PAST_DUE })
      )
    ).toBe("enterprise");
  });

  it("falls back to free once access is revoked (unpaid)", () => {
    expect(
      getCurrentPlan(
        makeSub({ plan: "enterprise", status: SUBSCRIPTION_STATUS.UNPAID })
      )
    ).toBe(PLAN_NAMES.FREE);
  });
});

describe("getStatusDisplayText", () => {
  it("labels the trialing status", () => {
    expect(getStatusDisplayText(SUBSCRIPTION_STATUS.TRIALING)).toBe("Trial");
  });

  it("handles a missing status", () => {
    expect(getStatusDisplayText(null)).toBe("No subscription");
  });
});
