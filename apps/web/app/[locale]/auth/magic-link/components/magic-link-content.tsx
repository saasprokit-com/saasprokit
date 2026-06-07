"use client";

import { MagicLinkErrorCard } from "@repo/design-system/components/molecules/auth/magic-link-error-card";
import { MagicLinkSentCard } from "@repo/design-system/components/molecules/auth/magic-link-sent-card";
import { useSearchParams } from "next/navigation";

export function MagicLinkContent() {
  const error = useSearchParams().get("error");

  if (error) {
    return <MagicLinkErrorCard error={error} />;
  }

  return <MagicLinkSentCard />;
}
