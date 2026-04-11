import { logger } from "@repo/logger/server";

export function register() {
  logger.info({}, "Next.js server started");
}

export function onRequestError(
  err: unknown,
  request: { path: string; method: string },
  context: {
    routerKind: string;
    routeType: string;
    renderSource?: string;
  }
) {
  const error = err instanceof Error ? err : new Error(String(err));
  const digest =
    typeof err === "object" && err !== null && "digest" in err
      ? (err as { digest: string }).digest
      : undefined;

  logger.error(
    {
      digest,
      message: error.message,
      stack: error.stack,
      path: request.path,
      method: request.method,
      routerKind: context.routerKind,
      routeType: context.routeType,
      renderSource: context.renderSource,
    },
    "Unhandled server error"
  );
}
