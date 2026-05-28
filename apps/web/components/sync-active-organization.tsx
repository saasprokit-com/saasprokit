"use client";

import { organization, useActiveOrganization } from "@repo/auth/client";
import { useEffect } from "react";

interface SyncActiveOrganizationProps {
  readonly organizationId: string;
}

/**
 * Keeps Better Auth's "active organization" client state aligned with the org
 * slug in the URL. Without this, useActiveOrganization() returns null on org
 * pages and any client hook that derives a referenceId from it (e.g.
 * useSubscription) will skip its fetch.
 */
export function SyncActiveOrganization({
  organizationId,
}: SyncActiveOrganizationProps) {
  const { data: activeOrg } = useActiveOrganization();

  useEffect(() => {
    if (activeOrg?.id === organizationId) {
      return;
    }
    organization.setActive({ organizationId });
  }, [activeOrg?.id, organizationId]);

  return null;
}
