"use client";

import { Separator } from "@repo/design-system/components/ui/separator";
import { cn } from "@repo/design-system/lib/utils";
import Link from "next/link";
import type * as React from "react";

export interface FooterLink {
  external?: boolean;
  href: string;
  label: string;
}

export interface FooterSection {
  links: FooterLink[];
  title: string;
}

export interface SocialLink {
  href: string;
  icon: React.ReactNode;
  label: string;
}

export interface FooterProps {
  bottomLinks?: FooterLink[];
  className?: string;
  copyright?: string;
  description?: string;
  logo?: React.ReactNode;
  sections?: FooterSection[];
  socialLinks?: SocialLink[];
}

export function Footer({
  logo,
  description,
  sections = [],
  socialLinks = [],
  copyright,
  bottomLinks = [],
  className,
}: FooterProps) {
  const currentYear = new Date().getFullYear();
  const defaultCopyright = `© ${currentYear} All rights reserved.`;

  return (
    <footer className={cn("border-t bg-background", className)}>
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand Section */}
          <div className="lg:col-span-4">
            {logo && <div className="mb-4">{logo}</div>}
            {description && (
              <p className="max-w-xs text-muted-foreground text-sm">
                {description}
              </p>
            )}
            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="mt-6 flex items-center gap-4">
                {socialLinks.map((social) => (
                  <a
                    aria-label={social.label}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    href={social.href}
                    key={social.label}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Link Sections */}
          {sections.length > 0 && (
            <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:col-span-8 lg:grid-cols-4">
              {sections.map((section) => (
                <div key={section.title}>
                  <h3 className="mb-4 font-semibold text-sm">
                    {section.title}
                  </h3>
                  <ul className="space-y-3">
                    {section.links.map((link, index) => (
                      <li key={index}>
                        {link.external ? (
                          <a
                            className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                            href={link.href}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link
                            className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                            href={link.href}
                          >
                            {link.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <Separator className="my-8" />
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-muted-foreground text-sm">
            {copyright || defaultCopyright}
          </p>
          {bottomLinks.length > 0 && (
            <nav className="flex items-center gap-4">
              {bottomLinks.map((link, index) => (
                <Link
                  className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                  href={link.href}
                  key={index}
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
