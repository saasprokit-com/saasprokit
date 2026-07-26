"use client";

import type { Subscription } from "@repo/database";
import {
  PLAN_NAMES,
  type PlanName,
  SUBSCRIPTION_STATUS,
} from "@repo/utils/payment";
import { useEffect, useRef, useState } from "react";
import { subscription } from "./client";
import {
  isAlreadyCancelingError,
  isSubscriptionPendingCancel,
} from "./helpers";
import { PLANS } from "./plans";
import type { SubscriptionWithPlan } from "./types";

type SubscriptionResult =
  | { ok: true; subscription: Subscription | null }
  | { ok: false; error: Error };

async function fetchOrgSubscription(
  organizationId: string
): Promise<SubscriptionResult> {
  try {
    const { data, error } = await subscription.list({
      query: { referenceId: organizationId },
    });
    if (error) {
      return { ok: false, error: new Error(error.message) };
    }
    return {
      ok: true,
      subscription: (data?.[0] || null) as unknown as Subscription | null,
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err : new Error("Failed to fetch subscription"),
    };
  }
}

interface UseSubscriptionReturn {
  error: Error | null;
  isActive: boolean;
  isCanceled: boolean;
  isLoading: boolean;
  isPaid: boolean;
  planName: PlanName;
  refetch: () => Promise<void>;
  subscription: Subscription | null;
  subscriptionWithPlan: SubscriptionWithPlan | null;
}

export function useSubscription(organizationId: string): UseSubscriptionReturn {
  const [subscriptionData, setSubscriptionData] = useState<Subscription | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setSubscriptionData(null);
      setIsLoading(false);
      return;
    }

    // The cleanup flag drops writes from a request whose organization has since
    // changed (or that resolves after unmount), avoiding stale-org overwrites.
    let active = true;
    setIsLoading(true);
    setError(null);

    fetchOrgSubscription(organizationId).then((result) => {
      if (!active) {
        return;
      }
      if (result.ok) {
        setSubscriptionData(result.subscription);
      } else {
        setError(result.error);
        setSubscriptionData(null);
      }
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [organizationId]);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);
    const result = await fetchOrgSubscription(organizationId);
    if (result.ok) {
      setSubscriptionData(result.subscription);
    } else {
      setError(result.error);
      setSubscriptionData(null);
    }
    setIsLoading(false);
  };

  const planName: PlanName = subscriptionData?.plan
    ? (subscriptionData.plan as PlanName)
    : PLAN_NAMES.FREE;

  const subscriptionWithPlan: SubscriptionWithPlan | null = subscriptionData
    ? { ...subscriptionData, planConfig: PLANS[planName] }
    : null;

  const isActive = subscriptionData?.status === SUBSCRIPTION_STATUS.ACTIVE;
  const isPaid = isActive && planName !== PLAN_NAMES.FREE;
  const isCanceled = isActive && isSubscriptionPendingCancel(subscriptionData);

  return {
    subscription: subscriptionData,
    subscriptionWithPlan,
    isLoading,
    error,
    planName,
    isPaid,
    isActive,
    isCanceled,
    refetch,
  };
}

interface UseCancelOptions {
  /** Current locale for URL construction (e.g., "en") */
  locale?: string;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
  /** Organization id whose subscription to cancel */
  organizationId: string;
  /** Organization slug for building the billing return URL */
  orgSlug: string;
}

interface UseCancelReturn {
  /** Cancel the current subscription */
  cancel: () => Promise<void>;
  /** Error if cancellation failed */
  error: Error | null;
  /** Whether a cancellation is in progress */
  isCanceling: boolean;
}

export function useCancel(options: UseCancelOptions): UseCancelReturn {
  const { subscription: currentSubscription } = useSubscription(
    options.organizationId
  );
  const [isCanceling, setIsCanceling] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const cancel = async () => {
    const { organizationId, orgSlug, locale } = optionsRef.current;
    if (!organizationId) {
      const noOrgError = new Error("No organization reference");
      setError(noOrgError);
      optionsRef.current.onError?.(noOrgError);
      return;
    }

    setIsCanceling(true);
    setError(null);

    try {
      const localePrefix = locale ? `/${locale}` : "";
      const { error: cancelError } = await subscription.cancel({
        referenceId: organizationId,
        subscriptionId: currentSubscription?.stripeSubscriptionId || undefined,
        returnUrl: `${window.location.origin}${localePrefix}/${orgSlug}/billing`,
      });

      // Better Auth client methods resolve with { error } rather than throwing,
      // so an unchecked call always looked successful. Surface real failures —
      // except the benign "already set to be canceled" 400, which means Stripe
      // has already scheduled the cancellation (local state had drifted). For
      // that case we fall through to onSuccess so the UI reloads and settles.
      if (cancelError && !isAlreadyCancelingError(cancelError.message)) {
        throw new Error(cancelError.message || "Failed to cancel subscription");
      }

      optionsRef.current.onSuccess?.();
    } catch (err) {
      const cancelError =
        err instanceof Error ? err : new Error("Failed to cancel subscription");
      setError(cancelError);
      optionsRef.current.onError?.(cancelError);
    } finally {
      setIsCanceling(false);
    }
  };

  return {
    cancel,
    isCanceling,
    error,
  };
}
