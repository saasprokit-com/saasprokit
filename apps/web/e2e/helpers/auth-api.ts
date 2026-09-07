import type { APIRequestContext, APIResponse } from "@playwright/test";

import { BASE_URL } from "../fixtures/test-config";

const DEFAULT_RETRY_AFTER_SECONDS = 60;
const RETRY_SLACK_MS = 1000;
const MAX_WAIT_MS = 70_000;

/**
 * POST a Better Auth endpoint, waiting out a 429 instead of failing on it.
 *
 * Better Auth's limiter is enabled in production, which is how CI runs the app,
 * and its auth rules are tight (5 sign-ins and 3 sign-ups per 60s per IP) —
 * tighter than a full suite pass needs. The window is anchored to the last
 * allowed hit, and a rejected request does not extend it, so sleeping for
 * retry-after and trying once more clears it. Slower, but the limit stays
 * enforced rather than being switched off for tests.
 */
export async function postAuth(
  request: APIRequestContext,
  path: string,
  data: Record<string, unknown>
): Promise<APIResponse> {
  const send = () =>
    request.post(path, { headers: { origin: BASE_URL }, data });

  const res = await send();
  if (res.status() !== 429) {
    return res;
  }

  const headers = res.headers();
  const retryAfter = Number.parseInt(
    headers["x-retry-after"] ?? headers["retry-after"] ?? "",
    10
  );
  const seconds = Number.isNaN(retryAfter)
    ? DEFAULT_RETRY_AFTER_SECONDS
    : retryAfter;

  await new Promise((resolve) =>
    setTimeout(resolve, Math.min(seconds * 1000 + RETRY_SLACK_MS, MAX_WAIT_MS))
  );

  return send();
}
