"use client";

import { organization, useActiveOrganization } from "@repo/auth/client";
import { useEffect, useRef } from "react";

interface SyncActiveOrganizationProps {
  readonly organizationId: string;
}

/**
 * Keeps Better Auth's "active organization" client state aligned with the
 * URL's `organizationId`. Without this, `useActiveOrganization()` returns
 * `null` on org pages and any client hook that derives a `referenceId` from
 * it (e.g. `useSubscription`) skips its fetch.
 *
 * Two non-obvious invariants in this effect:
 *
 * 1. `lastAttemptedRef` is an optimistic latch that prevents a multi-tab
 *    feedback loop. When tab A writes `activeOrganizationId=A`, BA's session
 *    revalidates in tab B (on /orgB), which changes `useActiveOrganization`
 *    there and re-runs this effect — without the latch, tab B would fire
 *    `setActive(B)` reactively, triggering the same revalidation in tab A,
 *    forever. The latch ensures each tab fires `setActive` for its URL slug
 *    at most once per successful settle.
 *
 * 2. On rejection we MUST reset the latch (so a transient network failure
 *    doesn't permanently disable the sync for this mount), but ONLY while
 *    the mount is still active. A late rejection from a stale request must
 *    not clobber a new mount's latch — the `cancelled` flag guards both the
 *    reset and the log.
 */
export function SyncActiveOrganization({
  organizationId,
}: SyncActiveOrganizationProps) {
  const { data: activeOrg } = useActiveOrganization();
  const lastAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeOrg?.id === organizationId) {
      return;
    }
    if (lastAttemptedRef.current === organizationId) {
      return;
    }
    lastAttemptedRef.current = organizationId;

    let cancelled = false;
    organization.setActive({ organizationId }).catch((err) => {
      if (cancelled) {
        return;
      }
      // Reset the latch so the next render can retry (only if the latch
      // still points at the org we attempted — defensive vs concurrent
      // re-runs that may already have set it to something newer).
      if (lastAttemptedRef.current === organizationId) {
        lastAttemptedRef.current = null;
      }
      console.error("[auth] setActive failed", err);
    });

    return () => {
      cancelled = true;
    };
  }, [activeOrg?.id, organizationId]);

  return null;
}
