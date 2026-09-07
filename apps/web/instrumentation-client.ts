import { logger } from "@repo/logger/log";

// Catch uncaught errors (e.g. in event handlers, setTimeout, etc.)
window.addEventListener("error", (event) => {
  logger.error("Uncaught error", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
  });
});

// Catch unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  logger.error("Unhandled promise rejection", {
    message: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

// Track client-side navigation
export function onRouterTransitionStart(
  url: string,
  navigationType: "push" | "replace" | "traverse"
) {
  logger.debug("Navigation started", { url, navigationType });
}
