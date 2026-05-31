"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function CheckoutRefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      className="flex-1"
      disabled={pending}
      onClick={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
      type="button"
    >
      {pending ? "Checking..." : "Check again"}
    </Button>
  );
}
