"use client";

import { ErrorContent } from "@repo/design-system/components/molecules/error/error-content";
import { Button } from "@repo/design-system/components/ui/button";
import { logger } from "@repo/logger/log";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AccountErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AccountError({ error, reset }: AccountErrorProps) {
  const router = useRouter();

  useEffect(() => {
    logger.error("Account page error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <ErrorContent
      className="h-auto min-h-[60vh] flex-1"
      code="500"
      description={
        <>
          We could not load this page. <br /> Please try again.
        </>
      }
      digest={error.digest}
      title={`Oops! Something went wrong :')`}
    >
      <Button onClick={() => router.back()} type="button" variant="outline">
        Go Back
      </Button>
      <Button onClick={reset} type="button">
        Try Again
      </Button>
    </ErrorContent>
  );
}
