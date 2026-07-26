import type { Subscription } from "@repo/database";
import {
  ACTIVE_STATUSES,
  PLAN_NAMES,
  type PlanName,
  SUBSCRIPTION_STATUS,
  type SubscriptionStatus,
  UNLIMITED,
} from "@repo/utils/payment";
import { getPlanLimits } from "./plans";
import type { UsageStats } from "./types";

const PERCENTAGE_MULTIPLIER = 100;
const STORAGE_GB_THRESHOLD = 1000; // MB threshold for displaying as GB
const FRACTION_DIGITS = 1; // For storage formatting

export function isSubscriptionActive(
  subscription: Subscription | null | undefined
): boolean {
  if (!subscription?.status) {
    return false;
  }
  return ACTIVE_STATUSES.includes(
    subscription.status as (typeof ACTIVE_STATUSES)[number]
  );
}
export function isSubscriptionPendingCancel(
  subscription: Subscription | null | undefined
): boolean {
  return (
    subscription?.cancelAtPeriodEnd === true || subscription?.cancelAt != null
  );
}

const ALREADY_CANCELING_MESSAGE = "already set to be canceled";

export function isAlreadyCancelingError(message: string | undefined): boolean {
  return message?.includes(ALREADY_CANCELING_MESSAGE) ?? false;
}

export function getCurrentPlan(
  subscription: Subscription | null | undefined
): PlanName {
  if (!isSubscriptionActive(subscription)) {
    return PLAN_NAMES.FREE;
  }
  return (subscription?.plan as PlanName) || PLAN_NAMES.FREE;
}

export function calculateUsageStats(
  subscription: Subscription | null | undefined,
  currentMembers: number,
  currentStorageMB: number
): UsageStats {
  const planName = getCurrentPlan(subscription);
  const limits = getPlanLimits(planName);

  const memberLimit =
    limits.maxMembers === UNLIMITED
      ? Number.POSITIVE_INFINITY
      : limits.maxMembers;
  const storageLimit =
    limits.maxStorageMB === UNLIMITED
      ? Number.POSITIVE_INFINITY
      : limits.maxStorageMB;

  return {
    members: {
      current: currentMembers,
      limit: limits.maxMembers,
      percentage:
        memberLimit === Number.POSITIVE_INFINITY
          ? 0
          : Math.round((currentMembers / memberLimit) * PERCENTAGE_MULTIPLIER),
    },
    storage: {
      currentMB: currentStorageMB,
      limitMB: limits.maxStorageMB,
      percentage:
        storageLimit === Number.POSITIVE_INFINITY
          ? 0
          : Math.round(
              (currentStorageMB / storageLimit) * PERCENTAGE_MULTIPLIER
            ),
    },
  };
}

export function formatStorage(mb: number): string {
  if (mb === UNLIMITED) {
    return "Unlimited";
  }
  if (mb >= STORAGE_GB_THRESHOLD) {
    return `${(mb / STORAGE_GB_THRESHOLD).toFixed(FRACTION_DIGITS)} GB`;
  }
  return `${mb} MB`;
}

export function formatDate(
  date: Date | string | null,
  locale = "en-US"
): string {
  if (!date) {
    return "N/A";
  }
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getStatusDisplayText(
  status: SubscriptionStatus | null | undefined
): string {
  if (!status) {
    return "No subscription";
  }

  const statusMap: Record<SubscriptionStatus, string> = {
    [SUBSCRIPTION_STATUS.INCOMPLETE]: "Incomplete",
    [SUBSCRIPTION_STATUS.INCOMPLETE_EXPIRED]: "Expired",
    [SUBSCRIPTION_STATUS.TRIALING]: "Trial",
    [SUBSCRIPTION_STATUS.ACTIVE]: "Active",
    [SUBSCRIPTION_STATUS.PAST_DUE]: "Past Due",
    [SUBSCRIPTION_STATUS.CANCELED]: "Canceled",
    [SUBSCRIPTION_STATUS.UNPAID]: "Unpaid",
    [SUBSCRIPTION_STATUS.PAUSED]: "Paused",
  };

  return statusMap[status] || status;
}

export function getStatusColor(
  status: SubscriptionStatus | null | undefined
): "green" | "yellow" | "red" | "gray" {
  if (!status) {
    return "gray";
  }

  switch (status) {
    case SUBSCRIPTION_STATUS.ACTIVE:
    case SUBSCRIPTION_STATUS.TRIALING:
      return "green";
    case SUBSCRIPTION_STATUS.PAST_DUE:
      return "yellow";
    case SUBSCRIPTION_STATUS.CANCELED:
    case SUBSCRIPTION_STATUS.UNPAID:
    case SUBSCRIPTION_STATUS.INCOMPLETE_EXPIRED:
      return "red";
    default:
      return "gray";
  }
}
