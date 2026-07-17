import "server-only";

import { database } from "@repo/database";
import { headers } from "next/headers";

/**
 * Server-side rate limiting for auth server actions.
 *
 * Better Auth's own per-route rate limits run only on the HTTP `/api/auth/*`
 * router path — a direct `auth.api.*` call from a server action bypasses them,
 * and the limiter's store logic is not exported. Since the auth flows now go
 * through server actions, this guard re-applies brute-force protection over the
 * same `RateLimit` table (keys namespaced with `sa:` so they can't collide with
 * Better Auth's own `${ip}|${path}` keys).
 */

const MS_PER_SECOND = 1000;

/** Per-scope limits, mirroring `packages/auth/server.ts` `rateLimit.customRules`. */
export const RATE_LIMITS = {
  "sign-in": { max: 5, window: 60 },
  "sign-up": { max: 3, window: 60 },
  forgot: { max: 3, window: 60 },
  reset: { max: 3, window: 60 },
  "2fa": { max: 5, window: 60 },
  "change-password": { max: 3, window: 60 },
  "magic-link": { max: 3, window: 60 },
  "otp-send": { max: 3, window: 60 },
  "verify-email-resend": { max: 3, window: 60 },
} as const satisfies Record<string, { max: number; window: number }>;

export type RateLimitScope = keyof typeof RATE_LIMITS;

/** Thrown when a scope's limit is exceeded; `retryAfter` is seconds. */
export class RateLimitError extends Error {
  readonly retryAfter: number;

  constructor(retryAfter: number) {
    super("Rate limit exceeded");
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

async function getClientIp(): Promise<string> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || requestHeaders.get("x-real-ip")?.trim() || "no-ip";
}

/**
 * Fixed-window rate limit. Throws {@link RateLimitError} when the scope's limit
 * is exceeded for the caller's IP. Concurrency is approximate (find + update,
 * no unique constraint) — acceptable for brute-force defense.
 */
export async function enforceRateLimit(scope: RateLimitScope): Promise<void> {
  const { max, window } = RATE_LIMITS[scope];
  const windowMs = window * MS_PER_SECOND;
  const now = Date.now();
  const ip = await getClientIp();
  const key = `sa:${scope}:${ip}`;

  const existing = await database.rateLimit.findFirst({ where: { key } });

  if (!existing) {
    await database.rateLimit.create({
      data: { key, count: 1, lastRequest: BigInt(now) },
    });
    return;
  }

  const windowStart = Number(existing.lastRequest);

  // Window elapsed → start a fresh one.
  if (now - windowStart > windowMs) {
    await database.rateLimit.update({
      where: { id: existing.id },
      data: { count: 1, lastRequest: BigInt(now) },
    });
    return;
  }

  if (existing.count >= max) {
    const retryAfter = Math.ceil(
      (windowMs - (now - windowStart)) / MS_PER_SECOND
    );
    throw new RateLimitError(retryAfter);
  }

  // Within the window and under the cap — count it (window start unchanged).
  await database.rateLimit.update({
    where: { id: existing.id },
    data: { count: { increment: 1 } },
  });
}
