import { format, formatDistanceToNow, formatRelative } from "date-fns";

/**
 * Format a date to a readable string (e.g., "Dec 13, 2024")
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) {
    return "";
  }
  return format(new Date(date), "MMM d, yyyy");
}

/**
 * Format a date to include time (e.g., "Dec 13, 2024 at 2:30 PM")
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) {
    return "";
  }
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
}

/**
 * Format a date as relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(
  date: Date | string | null | undefined
): string {
  if (!date) {
    return "";
  }
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Format a date relative to today (e.g., "today at 2:30 PM", "yesterday at 10:00 AM")
 */
export function formatRelativeDate(
  date: Date | string | null | undefined
): string {
  if (!date) {
    return "";
  }
  return formatRelative(new Date(date), new Date());
}

/**
 * Format a date in ISO format (e.g., "2024-12-13")
 */
export function formatISODate(date: Date | string | null | undefined): string {
  if (!date) {
    return "";
  }
  return format(new Date(date), "yyyy-MM-dd");
}

/**
 * Format a time only (e.g., "2:30 PM")
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) {
    return "";
  }
  return format(new Date(date), "h:mm a");
}
