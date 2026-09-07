"use client";

import "./styles.css";
import { ErrorContent } from "@repo/design-system/components/molecules/error/error-content";
import { Button } from "@repo/design-system/components/ui/button";
import { fonts } from "@repo/design-system/lib/fonts";
import { cn } from "@repo/design-system/lib/utils";
import { logger } from "@repo/logger/log";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const router = useRouter();

  useEffect(() => {
    logger.error("Global error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      {/* global-error replaces the root layout, so `fonts` has to be applied
          here too — otherwise the font variables are undefined and every 500
          page renders in the browser default. */}
      <body className={cn(fonts, "min-h-screen bg-background text-foreground")}>
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
      </body>
    </html>
  );
}
