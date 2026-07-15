"use client";

import { cn } from "@repo/design-system/lib/utils";
import type { ReactNode } from "react";

export interface ErrorContentProps {
  children: ReactNode;
  className?: string;
  code: string;
  description: ReactNode;
  digest?: string;
  title: string;
}

/**
 * Shared presentation for error and not-found states: a large status code, a
 * title, a description, an optional error digest, and a row of caller-supplied
 * action buttons.
 *
 * Defaults to a full-viewport layout (`h-svh`). Pass `className` to render it
 * contained inside an app shell, e.g. "h-auto min-h-[60vh] flex-1".
 *
 * Keeps "use client" even though it has no hooks: it is rendered by the app's
 * global-error boundary, which replaces the root layout entirely.
 */
export function ErrorContent({
  className,
  code,
  title,
  description,
  digest,
  children,
}: ErrorContentProps) {
  return (
    <div className={cn("h-svh", className)}>
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <h1 className="font-bold text-[7rem] leading-tight">{code}</h1>
        <span className="font-medium">{title}</span>
        <p className="text-center text-muted-foreground">{description}</p>
        {digest && (
          <p className="font-mono text-muted-foreground text-xs">
            Error ID: {digest}
          </p>
        )}
        <div className="mt-6 flex gap-4">{children}</div>
      </div>
    </div>
  );
}
