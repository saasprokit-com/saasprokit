import { SuspenseFallback } from "@repo/design-system/components/ui/suspense-fallback";
import { Suspense } from "react";
import { MagicLinkContent } from "./components/magic-link-content";

export default function MagicLinkPage() {
  return (
    <div className="w-full max-w-md">
      <Suspense fallback={<SuspenseFallback />}>
        <MagicLinkContent />
      </Suspense>
    </div>
  );
}
