"use client";

import "./styles.css";
import { logger } from "@repo/logger/client";
import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    logger.error("Global error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="m-0 flex min-h-screen items-center justify-center bg-neutral-50 font-sans text-neutral-900 antialiased">
        <div className="text-center">
          <h1 className="m-0 font-bold text-[7rem] leading-tight">500</h1>
          <p className="my-2 font-medium">Oops! Something went wrong {`:')`}</p>
          <p className="mb-4 text-neutral-500">
            We apologize for the inconvenience. <br /> Please try again later.
          </p>
          {error.digest && (
            <p className="mb-4 font-mono text-neutral-400 text-xs">
              Error ID: {error.digest}
            </p>
          )}
          <div className="mt-6 flex justify-center gap-4">
            <button
              className="cursor-pointer rounded-md border border-neutral-200 bg-transparent px-4 py-2 font-medium text-neutral-900 text-sm"
              onClick={() => window.history.back()}
              type="button"
            >
              Go Back
            </button>
            <button
              className="cursor-pointer rounded-md border-none bg-neutral-900 px-4 py-2 font-medium text-neutral-50 text-sm"
              onClick={reset}
              type="button"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
