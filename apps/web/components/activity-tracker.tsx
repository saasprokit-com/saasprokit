"use client";

import { useActivityTracker } from "@/hooks/use-activity-tracker";

/**
 * Add this to authenticated layouts to update lastActiveAt.
 */
export function ActivityTracker() {
  useActivityTracker();
  return null;
}
