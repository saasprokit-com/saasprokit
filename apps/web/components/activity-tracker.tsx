"use client";

import { useActivityTracker } from "@/hooks/use-activity-tracker";

/**
 * Client component that tracks user activity.
 * Add this to authenticated layouts to update lastActiveAt.
 */
export function ActivityTracker() {
  useActivityTracker();
  return null;
}
