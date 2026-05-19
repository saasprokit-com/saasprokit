import "server-only";

import { createRequestLogger } from "@repo/logger/server";
import { PLAN_NAMES, type PlanName, PRICING } from "@repo/utils/payment";
import { unstable_cache } from "next/cache";
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

    return {
      [PLAN_NAMES.FREE]: FALLBACK_PRICES[PLAN_NAMES.FREE],
      [PLAN_NAMES.PRO]: {
        monthly: (proMonthly.unit_amount ?? 0) / CENTS_PER_DOLLAR,
        yearly: (proYearly.unit_amount ?? 0) / CENTS_PER_DOLLAR,
        currency: proMonthly.currency,
        source: "stripe",
      },
      [PLAN_NAMES.ENTERPRISE]: {
        monthly: (entMonthly.unit_amount ?? 0) / CENTS_PER_DOLLAR,
        yearly: (entYearly.unit_amount ?? 0) / CENTS_PER_DOLLAR,
        currency: entMonthly.currency,
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
