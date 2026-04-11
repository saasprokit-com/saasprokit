"use client";

import { cn } from "@repo/design-system/lib/utils";
import Link from "next/link";
import type * as React from "react";

export type HeaderProps = {
  logo?: React.ReactNode;
  logoHref?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
};

export function Header({
  logo,
  logoHref = "/",
  left,
  right,
  className,
}: HeaderProps) {
  return (
    <header className={cn("border-border border-b", className)}>
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo + Left section */}
          <div className="flex items-center gap-8">
            {logo && (
              <Link className="font-bold text-2xl" href={logoHref}>
                {logo}
              </Link>
            )}
            {left}
          </div>

          {/* Right section */}
          {right}
        </div>
      </div>
    </header>
  );
}
