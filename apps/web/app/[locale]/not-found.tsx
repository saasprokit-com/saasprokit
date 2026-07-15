"use client";

import { ErrorContent } from "@repo/design-system/components/molecules/error/error-content";
import { Button } from "@repo/design-system/components/ui/button";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  return (
    <ErrorContent
      code="404"
      description={
        <>
          It seems like the page you&apos;re looking for <br />
          does not exist or might have been removed.
        </>
      }
      title="Oops! Page Not Found!"
    >
      <Button onClick={() => router.back()} variant="outline">
        Go Back
      </Button>
      <Button onClick={() => router.push("/")}>Back to Home</Button>
    </ErrorContent>
  );
}
