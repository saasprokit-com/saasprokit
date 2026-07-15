"use client";

import { ErrorContent } from "@repo/design-system/components/molecules/error/error-content";
import { Button } from "@repo/design-system/components/ui/button";
import { logger } from "@repo/logger/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const router = useRouter();

  useEffect(() => {
    logger.error("Unhandled error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <ErrorContent
      code="500"
      description={
        <>
          We apologize for the inconvenience. <br /> Please try again later.
        </>
      }
      digest={error.digest}
      title={`Oops! Something went wrong :')`}
    >
      <Button onClick={() => router.back()} variant="outline">
        Go Back
      </Button>
      <Button onClick={reset}>Try Again</Button>
    </ErrorContent>
  );
}
