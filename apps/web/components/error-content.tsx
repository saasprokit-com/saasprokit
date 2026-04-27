"use client";

import type { ReactNode } from "react";

interface ErrorContentProps {
  code: string;
  title: string;
  description: ReactNode;
  digest?: string;
  children: ReactNode;
}

export function ErrorContent({
  code,
  title,
  description,
  digest,
  children,
}: ErrorContentProps) {
  return (
    <div className="h-svh">
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
