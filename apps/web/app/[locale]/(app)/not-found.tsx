"use client";

import { ErrorContent } from "@repo/design-system/components/molecules/error/error-content";
import { Button } from "@repo/design-system/components/ui/button";
import { useRouter } from "next/navigation";
import { PAGE_ROUTES } from "@/lib/routes";

/**
 * Catches notFound() thrown by [orgSlug]/layout.tsx for an unknown or
 * non-member slug. That aborts the org layout before any shell renders, so this
 * is the closest boundary that can catch it — and org chrome would be wrong here
 * anyway, since the user has no access to that org.
 */
export default function AppNotFound() {
  const router = useRouter();

  return (
    <ErrorContent
      code="404"
      description={
        <>
          This organization does not exist, or you no longer <br />
          have access to it.
        </>
      }
      title="Organization not found"
    >
      <Button
        onClick={() => router.push(PAGE_ROUTES.ORG)}
        type="button"
        variant="outline"
      >
        My organizations
      </Button>
      <Button
        onClick={() => router.push(PAGE_ROUTES.ACCOUNT_NEW_ORG)}
        type="button"
      >
        Create organization
      </Button>
    </ErrorContent>
  );
}
