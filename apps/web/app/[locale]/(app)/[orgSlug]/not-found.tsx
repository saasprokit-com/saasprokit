"use client";

import { ErrorContent } from "@repo/design-system/components/molecules/error/error-content";
import { Button } from "@repo/design-system/components/ui/button";
import { useRouter } from "next/navigation";

export default function OrgNotFound() {
  const router = useRouter();

  return (
    <ErrorContent
      className="h-auto min-h-[60vh] flex-1"
      code="404"
      description={
        <>
          It seems like the page you&apos;re looking for <br />
          does not exist or might have been removed.
        </>
      }
      title="Oops! Page Not Found!"
    >
      <Button onClick={() => router.back()} type="button" variant="outline">
        Go Back
      </Button>
    </ErrorContent>
  );
}
