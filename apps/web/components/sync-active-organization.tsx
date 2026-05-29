"use client";

import { organization, useActiveOrganization } from "@repo/auth/client";
import { useEffect, useRef } from "react";

interface SyncActiveOrganizationProps {
  readonly organizationId: string;
}

/**
 * Keeps Better Auth's "active organization" client state aligned with the org
 * slug in the URL. Without this, useActiveOrganization() returns null on org
 * pages and any client hook that derives a referenceId from it (e.g.
 * useSubscription) will skip its fetch.
 *
 * Defensive against three failure modes the adversarial review surfaced:
 * 1. Unhandled promise rejection if setActive fails (network blip, server 4xx)
 * 2. Stale-after-unmount: user navigates away mid-flight, response arrives
 *    after a new sync has been kicked off for a different org
 * 3. Multi-tab ping-pong: two tabs on different orgs each react to the other
 *    tab's revalidated session, looping setActive forever
 *
 * We guard (3) with a per-mount ref of the last attempted id so each tab only
 * fires setActive when the URL slug actually changes, not when another tab's
 * write revalidates this tab's useActiveOrganization result.
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
    // Already attempted this slug from this tab — let the activeOrg sync
    // settle rather than re-firing on every other-tab revalidation.
    if (lastAttemptedRef.current === organizationId) {
      return;
    }
    lastAttemptedRef.current = organizationId;

    let cancelled = false;
    organization
      .setActive({ organizationId })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        console.error("[auth] setActive failed", err);
      });

    return () => {
      cancelled = true;
    };
  }, [activeOrg?.id, organizationId]);

  return null;
}
