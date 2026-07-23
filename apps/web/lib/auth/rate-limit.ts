import "server-only";

import { database } from "@repo/database";
import { createRequestLogger } from "@repo/logger/server";
import { MILLISECONDS_PER_SECOND } from "@repo/utils/date";
import { getIp } from "better-auth/api";
import { headers } from "next/headers";

/**
 * Server-side rate limiting for auth server actions.
 *
 * Better Auth's own limiter runs only on the HTTP `/api/auth/*` router path — a
 * direct `auth.api.*` call from a server action bypasses it. This module is a
 * direct port of Better Auth's database `consume()` algorithm
 * (better-auth dist/api/rate-limiter/index.mjs) over the same `RateLimit` table:
 * create-on-miss arbitrated by the unique index on `key`, and guarded
 * compare-and-set updates so concurrent requests cannot pass a stale read.
 * Keys are namespaced `sa:` so they never collide with Better Auth's
 * `${ip}|${path}` HTTP keys. Keep every window <= 60s: Better Auth's
 * key-agnostic prune deletes rows older than its own max window (60s).
 */

/** Per-scope limits, kept in sync with `packages/auth/server.ts` `rateLimit.customRules`. */
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

const NO_TRUSTED_IP_KEY = "no-trusted-ip";
let ipWarningLogged = false;

/**
 * Resolve the client IP exactly like Better Auth's HTTP limiter: `getIp` with
 * no `advanced.ipAddress` config trusts only a single-value x-forwarded-for
 * (multi-hop chains are refused as forgeable), falls back to 127.0.0.1 in
 * dev/test, and returns null in production when no trustworthy IP resolves.
 */
async function getClientIp(): Promise<string> {
  const ip = getIp(await headers(), {});
  if (ip) {
    return ip;
  }
  if (!ipWarningLogged) {
    createRequestLogger({ action: "rateLimit" }).warn(
      "Rate limiting could not determine a client IP and is falling back to a single shared per-scope bucket."
    );
    ipWarningLogged = true;
  }
  return NO_TRUSTED_IP_KEY;
}

function getRetryAfter(lastRequest: bigint, windowMs: number): number {
  return Math.ceil(
    (Number(lastRequest) + windowMs - Date.now()) / MILLISECONDS_PER_SECOND
  );
}

/**
 * Better Auth's database `consume()`, in Prisma terms. Every branch is
 * arbitrated by the database, not by what this process read:
 * - miss  -> `create`; a concurrent duplicate throws on the unique `key` index,
 *            and the loser retries against the winner's row;
 * - reset -> guarded CAS (`lastRequest <= <read value>`) so one racer wins;
 * - hit   -> single-statement conditional increment
 *            (`lastRequest > windowStart AND count < max`); zero rows updated
 *            means at-cap or a concurrent reset — re-read and decide.
 * Like Better Auth, `lastRequest` advances on every allowed hit (the window is
 * inactivity-anchored, stricter than a fixed window).
 */
async function consume(
  key: string,
  max: number,
  windowMs: number
): Promise<void> {
  const now = Date.now();
  const row = await database.rateLimit.findUnique({ where: { key } });

  if (!row) {
    try {
      await database.rateLimit.create({
        data: { key, count: 1, lastRequest: BigInt(now) },
      });
      return;
    } catch (error) {
      // Unique violation: another request created the row first — retry.
      if (!(await database.rateLimit.findUnique({ where: { key } }))) {
        throw error;
      }
      return consume(key, max, windowMs);
    }
  }

  // Window elapsed -> reset, guarded so only one concurrent racer wins.
  if (now - Number(row.lastRequest) > windowMs) {
    const reset = await database.rateLimit.updateMany({
      where: { key, lastRequest: { lte: row.lastRequest } },
      data: { count: 1, lastRequest: BigInt(now) },
    });
    if (reset.count > 0) {
      return;
    }
    return consume(key, max, windowMs);
  }

  // In-window: atomic conditional increment — the guards are re-checked by the
  // database at write time, so concurrent requests cannot all pass the cap.
  const hit = await database.rateLimit.updateMany({
    where: {
      key,
      lastRequest: { gt: BigInt(now - windowMs) },
      count: { lt: max },
    },
    data: { count: { increment: 1 }, lastRequest: BigInt(now) },
  });
  if (hit.count > 0) {
    return;
  }

  // CAS failed: at cap, or the window rolled underneath us — re-read to decide.
  const fresh = await database.rateLimit.findUnique({ where: { key } });
  if (!fresh || now - Number(fresh.lastRequest) > windowMs) {
    return consume(key, max, windowMs);
  }
  throw new RateLimitError(getRetryAfter(fresh.lastRequest, windowMs));
}

/**
 * Throws {@link RateLimitError} when the scope's limit is exceeded for the
 * caller's IP.
 */
export async function enforceRateLimit(scope: RateLimitScope): Promise<void> {
  const { max, window } = RATE_LIMITS[scope];
  const ip = await getClientIp();
  await consume(`sa:${scope}:${ip}`, max, window * MILLISECONDS_PER_SECOND);
}
