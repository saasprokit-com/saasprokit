"use client";

import { cn } from "@repo/design-system/lib/utils";
import Link from "next/link";
import type * as React from "react";

export interface SimpleFooterLink {
  href: string;
  label: string;
}

export interface SimpleFooterProps {
  className?: string;
  copyright?: string;
  links?: SimpleFooterLink[];
  logo?: React.ReactNode;
}

export function SimpleFooter({
  logo,
  links = [],
  copyright,
  className,
}: SimpleFooterProps) {
  const currentYear = new Date().getFullYear();
  const defaultCopyright = `© ${currentYear} All rights reserved.`;

  return (
    <footer className={cn("border-t bg-background py-6", className)}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Logo or Copyright */}
          <div className="flex items-center gap-4">
            {logo}
            <p className="text-muted-foreground text-sm">
              {copyright || defaultCopyright}
            </p>
          </div>

          {/* Links */}
          {links.length > 0 && (
            <nav className="flex items-center gap-6">
              {links.map((link) => (
                <Link
                  className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
}
