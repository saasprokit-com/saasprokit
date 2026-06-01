"use client";

import { subscription, useActiveOrganization } from "@repo/auth/client";
import {
  PLAN_NAMES,
  type PlanName,
  SUBSCRIPTION_STATUS,
} from "@repo/utils/payment";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  isAlreadyCancelingError,
  isSubscriptionPendingCancel,
} from "./helpers";
import { PLANS } from "./plans";
import type { Subscription, SubscriptionWithPlan } from "./types";

interface UseSubscriptionOptions {
  /** Reference ID to fetch subscription for (org ID). If not provided, uses active organization */
  referenceId?: string;
}

interface UseSubscriptionReturn {
  /** The current subscription data */
  subscription: Subscription | null;
  /** Subscription with plan configuration */
  subscriptionWithPlan: SubscriptionWithPlan | null;
  /** Whether the subscription data is loading */
  isLoading: boolean;
  /** Error if subscription fetch failed */
  error: Error | null;
  /** The current plan name */
  planName: PlanName;
  /** Whether the user has a paid plan */
  isPaid: boolean;
  /** Whether the subscription is active */
  isActive: boolean;
  /** Whether the subscription is canceled but still active */
  isCanceled: boolean;
  /** Refetch the subscription data */
  refetch: () => Promise<void>;
}

/**
 * Hook to get the current subscription for an organization
 */
export function useSubscription(
  options: UseSubscriptionOptions = {}
): UseSubscriptionReturn {
  const { data: activeOrg } = useActiveOrganization();
  const [subscriptionData, setSubscriptionData] = useState<Subscription | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Monotonic counter for request deduplication (immune to same-ms races)
  const requestCounterRef = useRef(0);
  const currentRequestRef = useRef<{ id: number; referenceId: string }>({
    id: 0,
    referenceId: "",
  });

  const referenceId = options.referenceId || activeOrg?.id;

  const isStaleRequest = useCallback(
    (requestId: number, requestReferenceId: string): boolean =>
      currentRequestRef.current.id !== requestId ||
      currentRequestRef.current.referenceId !== requestReferenceId,
    []
  );

  const handleSubscriptionSuccess = useCallback(
    (
      data: unknown[] | undefined,
      requestId: number,
      currentReferenceId: string
    ) => {
      if (isStaleRequest(requestId, currentReferenceId)) {
        return;
      }
      const sub = (data?.[0] || null) as unknown as Subscription | null;
      setSubscriptionData(sub);
    },
    [isStaleRequest]
  );

  const handleSubscriptionError = useCallback(
    (err: unknown, requestId: number, currentReferenceId: string) => {
      if (isStaleRequest(requestId, currentReferenceId)) {
        return;
      }
      setError(
        err instanceof Error ? err : new Error("Failed to fetch subscription")
      );
      setSubscriptionData(null);
    },
    [isStaleRequest]
  );

  const fetchSubscription = useCallback(async () => {
    if (!referenceId) {
      setSubscriptionData(null);
      setIsLoading(false);
      return;
    }

    const requestId = ++requestCounterRef.current;
    const currentReferenceId = referenceId;
    currentRequestRef.current = {
      id: requestId,
      referenceId: currentReferenceId,
    };

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await subscription.list({
        query: {
          referenceId: currentReferenceId,
        },
      });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      handleSubscriptionSuccess(data, requestId, currentReferenceId);
    } catch (err) {
      handleSubscriptionError(err, requestId, currentReferenceId);
    } finally {
      if (!isStaleRequest(requestId, currentReferenceId)) {
        setIsLoading(false);
      }
    }
  }, [
    referenceId,
    isStaleRequest,
    handleSubscriptionSuccess,
    handleSubscriptionError,
  ]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const planName: PlanName = useMemo(() => {
    if (!subscriptionData?.plan) {
      return PLAN_NAMES.FREE;
    }
    return subscriptionData.plan as PlanName;
  }, [subscriptionData]);

  const subscriptionWithPlan: SubscriptionWithPlan | null = useMemo(() => {
    if (!subscriptionData) {
      return null;
    }
    return {
      ...subscriptionData,
      planConfig: PLANS[planName],
    };
  }, [subscriptionData, planName]);

  const isActive = useMemo(
    () => subscriptionData?.status === SUBSCRIPTION_STATUS.ACTIVE,
    [subscriptionData]
  );

  const isPaid = useMemo(
    () => isActive && planName !== PLAN_NAMES.FREE,
    [isActive, planName]
  );

  const isCanceled = useMemo(
    () => isActive && isSubscriptionPendingCancel(subscriptionData),
    [isActive, subscriptionData]
  );

  return {
    subscription: subscriptionData,
    subscriptionWithPlan,
    isLoading,
    error,
    planName,
    isPaid,
    isActive,
    isCanceled,
    refetch: fetchSubscription,
  };
}

interface UseCancelOptions {
  /** Current locale for URL construction (e.g., "en") */
  locale?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseCancelReturn {
  /** Cancel the current subscription */
  cancel: () => Promise<void>;
  /** Whether a cancellation is in progress */
  isCanceling: boolean;
  /** Error if cancellation failed */
  error: Error | null;
}

/**
 * Hook to handle subscription cancellation
 */
export function useCancel(options: UseCancelOptions = {}): UseCancelReturn {
  const { data: activeOrg } = useActiveOrganization();
  const { subscription: currentSubscription } = useSubscription();
  const [isCanceling, setIsCanceling] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const cancel = useCallback(async () => {
    if (!activeOrg) {
      setError(new Error("No active organization"));
      optionsRef.current.onError?.(new Error("No active organization"));
      return;
    }

    setIsCanceling(true);
    setError(null);

    try {
      const localePrefix = optionsRef.current.locale
        ? `/${optionsRef.current.locale}`
        : "";
      const { error: cancelError } = await subscription.cancel({
        referenceId: activeOrg.id,
        subscriptionId: currentSubscription?.stripeSubscriptionId || undefined,
        returnUrl: `${window.location.origin}${localePrefix}/${activeOrg.slug}/billing`,
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
  }, [activeOrg, currentSubscription]);

  return {
    cancel,
    isCanceling,
    error,
  };
}
