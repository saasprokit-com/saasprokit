"use client";

import { cn } from "@repo/design-system/lib/utils";
import Link from "next/link";
import type * as React from "react";

export interface HeaderProps {
  logo?: React.ReactNode;
  logoHref?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  transparent?: boolean;
  sticky?: boolean;
  className?: string;
}

export function Header({
  logo,
  logoHref = "/",
  left,
  right,
  transparent = false,
  sticky = false,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        "border-border border-b",
        !transparent && "bg-background",
        sticky && "sticky top-0 z-40",
        sticky &&
          !transparent &&
          "backdrop-blur supports-backdrop-filter:bg-background/80",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {logo && (
              <Link className="font-bold text-2xl" href={logoHref}>
                {logo}
              </Link>
            )}
            {left}
          </div>

          {right}
        </div>
      </div>
    </header>
  );
}
