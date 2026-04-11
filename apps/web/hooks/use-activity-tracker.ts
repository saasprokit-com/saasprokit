"use client";

import { MILLISECONDS_PER_SECOND, SECONDS_PER_MINUTE } from "@repo/utils/date";
import { useEffect, useRef } from "react";

import { API_ROUTES } from "@/lib/routes";

// Track activity every 5 minutes while user is active
const TRACKING_MINUTES = 5;
const TRACKING_INTERVAL_MS =
  TRACKING_MINUTES * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

export function useActivityTracker() {
  const lastTrackedRef = useRef<number>(0);

  useEffect(() => {
    const trackActivity = async () => {
      const now = Date.now();

      // Debounce on client side too
      if (now - lastTrackedRef.current < TRACKING_INTERVAL_MS) {
        return;
      }

      lastTrackedRef.current = now;

      try {
        await fetch(API_ROUTES.USER_ACTIVITY, {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // Silently fail - activity tracking is not critical
      }
    };

    // Track immediately on mount
    trackActivity();

    // Track on user interactions
    const events = ["mousedown", "keydown", "scroll", "touchstart"];

    const handleUserActivity = () => {
      trackActivity();
    };

    // Add event listeners
    for (const event of events) {
      window.addEventListener(event, handleUserActivity, { passive: true });
    }

    // Also track periodically in case user is just watching content
    const intervalId = setInterval(trackActivity, TRACKING_INTERVAL_MS);

    return () => {
      for (const event of events) {
        window.removeEventListener(event, handleUserActivity);
      }
      clearInterval(intervalId);
    };
  }, []);
}
