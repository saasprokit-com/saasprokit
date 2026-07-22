"use client";

import { subscription } from "@repo/auth/client";
import {
  PLAN_NAMES,
  type PlanName,
  SUBSCRIPTION_STATUS,
} from "@repo/utils/payment";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isSubscriptionPendingCancel } from "./helpers";
import { PLANS } from "./plans";
import type { Subscription, SubscriptionWithPlan } from "./types";

interface UseSubscriptionOptions {
  /** Organization ID to fetch the subscription for. Pass the server-resolved id from getActiveOrganization. */
  referenceId: string;
}

interface UseSubscriptionReturn {
  /** Error if subscription fetch failed */
  error: Error | null;
  isActive: boolean;
  /** Whether the subscription is canceled but still active */
  isCanceled: boolean;
  isLoading: boolean;
  /** Whether the user has a paid plan */
  isPaid: boolean;
  planName: PlanName;
  refetch: () => Promise<void>;
  subscription: Subscription | null;
  /** Subscription with plan configuration */
  subscriptionWithPlan: SubscriptionWithPlan | null;
}

export function useSubscription(
  options: UseSubscriptionOptions
): UseSubscriptionReturn {
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

  const referenceId = options.referenceId;

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
