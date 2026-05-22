import "server-only";

import { createRequestLogger } from "@repo/logger/server";
import { PLAN_NAMES, type PlanName, PRICING } from "@repo/utils/payment";
import { unstable_cache } from "next/cache";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/billing/stripe";
import { env } from "@/lib/env";

const CENTS_PER_DOLLAR = 100;
const ONE_HOUR_SECONDS = 3600;

export const STRIPE_PRICES_CACHE_TAG = "stripe-prices";

export type PriceSource = "stripe" | "fallback";

export interface PlanDisplayPrice {
  monthly: number;
  yearly: number;
  currency: string;
  source: PriceSource;
}

export type PlanDisplayPrices = Record<PlanName, PlanDisplayPrice>;

const FALLBACK_PRICES: PlanDisplayPrices = {
  [PLAN_NAMES.FREE]: {
    monthly: PRICING.FREE.MONTHLY,
    yearly: PRICING.FREE.YEARLY,
    currency: "usd",
    source: "fallback",
  },
  [PLAN_NAMES.PRO]: {
    monthly: PRICING.PRO.MONTHLY,
    yearly: PRICING.PRO.YEARLY,
    currency: "usd",
    source: "fallback",
  },
  [PLAN_NAMES.ENTERPRISE]: {
    monthly: PRICING.ENTERPRISE.MONTHLY,
    yearly: PRICING.ENTERPRISE.YEARLY,
    currency: "usd",
    source: "fallback",
  },
};

const logger = createRequestLogger({
  endpoint: "lib/billing/prices",
  method: "GET",
});

const SUPPORTED_CURRENCY = "usd";

/**
 * Convert a Stripe Price into a major-unit number safe to display.
 *
 * Returns null when the price can't be safely rendered as a static amount:
 *   - unit_amount is null (tiered, metered, or custom pricing)
 *   - currency is not the SUPPORTED_CURRENCY (zero-decimal currencies like JPY
 *     would otherwise be 100x-too-small after dividing by CENTS_PER_DOLLAR)
 *
 * The caller decides what to do with null (per-plan fallback vs full-table fallback).
 */
function toMajorUnits(price: Stripe.Price): number | null {
  if (price.currency !== SUPPORTED_CURRENCY) {
    return null;
  }
  if (price.unit_amount === null) {
    return null;
  }
  return price.unit_amount / CENTS_PER_DOLLAR;
}

async function fetchPricesFromStripe(): Promise<PlanDisplayPrices> {
  if (!env.STRIPE_SECRET_KEY) {
    return FALLBACK_PRICES;
  }

  const proMonthlyId = env.STRIPE_PRO_PRICE_ID_MONTHLY;
  const proAnnualId = env.STRIPE_PRO_PRICE_ID_ANNUAL;
  const enterpriseMonthlyId = env.STRIPE_ENTERPRISE_PRICE_ID_MONTHLY;
  const enterpriseAnnualId = env.STRIPE_ENTERPRISE_PRICE_ID_ANNUAL;

  if (
    !(proMonthlyId && proAnnualId && enterpriseMonthlyId && enterpriseAnnualId)
  ) {
    return FALLBACK_PRICES;
  }

  try {
    const stripe = getStripeClient();
    const [proMonthly, proYearly, entMonthly, entYearly] = await Promise.all([
      stripe.prices.retrieve(proMonthlyId),
      stripe.prices.retrieve(proAnnualId),
      stripe.prices.retrieve(enterpriseMonthlyId),
      stripe.prices.retrieve(enterpriseAnnualId),
    ]);

    const proMonthlyAmount = toMajorUnits(proMonthly);
    const proYearlyAmount = toMajorUnits(proYearly);
    const entMonthlyAmount = toMajorUnits(entMonthly);
    const entYearlyAmount = toMajorUnits(entYearly);

    if (
      proMonthlyAmount === null ||
      proYearlyAmount === null ||
      entMonthlyAmount === null ||
      entYearlyAmount === null
    ) {
      logger.warn(
        {
          proMonthly: {
            id: proMonthly.id,
            currency: proMonthly.currency,
            unit_amount: proMonthly.unit_amount,
          },
          proYearly: {
            id: proYearly.id,
            currency: proYearly.currency,
            unit_amount: proYearly.unit_amount,
          },
          entMonthly: {
            id: entMonthly.id,
            currency: entMonthly.currency,
            unit_amount: entMonthly.unit_amount,
          },
          entYearly: {
            id: entYearly.id,
            currency: entYearly.currency,
            unit_amount: entYearly.unit_amount,
          },
        },
        "Stripe returned an unsupported currency or null unit_amount, using fallback"
      );
      return FALLBACK_PRICES;
    }

    return {
      [PLAN_NAMES.FREE]: FALLBACK_PRICES[PLAN_NAMES.FREE],
      [PLAN_NAMES.PRO]: {
        monthly: proMonthlyAmount,
        yearly: proYearlyAmount,
        currency: SUPPORTED_CURRENCY,
        source: "stripe",
      },
      [PLAN_NAMES.ENTERPRISE]: {
        monthly: entMonthlyAmount,
        yearly: entYearlyAmount,
        currency: SUPPORTED_CURRENCY,
        source: "stripe",
      },
    };
  } catch (error) {
    logger.warn(
      { err: error },
      "Failed to fetch prices from Stripe, using fallback"
    );
    return FALLBACK_PRICES;
  }
}

export const getDisplayPrices = unstable_cache(
  fetchPricesFromStripe,
  ["stripe-display-prices"],
  {
    revalidate: ONE_HOUR_SECONDS,
    tags: [STRIPE_PRICES_CACHE_TAG],
  }
);
