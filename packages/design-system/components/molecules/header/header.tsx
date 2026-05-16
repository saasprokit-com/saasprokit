"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@repo/design-system/components/ui/navigation-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/design-system/components/ui/sheet";
import { cn } from "@repo/design-system/lib/utils";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

export interface HeaderNavItem {
  href: string;
  label: string;
  external?: boolean;
}

export interface HeaderProps {
  logo?: ReactNode;
  logoHref?: string;
  items?: HeaderNavItem[];
  right?: ReactNode;
  transparent?: boolean;
  sticky?: boolean;
  className?: string;
  mobileBreakpoint?: "md" | "lg";
}

const BREAKPOINT_CLASSES = {
  md: { desktopNav: "hidden md:flex", mobileTrigger: "md:hidden" },
  lg: { desktopNav: "hidden lg:flex", mobileTrigger: "lg:hidden" },
} as const;

const MOBILE_LINK_CLASSES =
  "rounded-md px-3 py-2 text-base text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent/50 data-[active=true]:text-foreground";

export function Header({
  logo,
  logoHref = "/",
  items = [],
  right,
  transparent = false,
  sticky = false,
  className,
  mobileBreakpoint = "md",
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const bp = BREAKPOINT_CLASSES[mobileBreakpoint];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (item: HeaderNavItem) => {
    if (item.external || !item.href.startsWith("/")) {
      return false;
    }
    if (item.href === "/") {
      return pathname === "/";
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <header
      className={cn(
        "border-border border-b",
        !transparent && "bg-background",
        sticky && "sticky top-0 z-40",
        sticky &&
          !transparent &&
          "backdrop-blur supports-backdrop-filter:bg-background/80",
        className
      )}
      data-scrolled={scrolled}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {logo && (
              <Link className="font-bold text-2xl" href={logoHref}>
                {logo}
              </Link>
            )}
            {items.length > 0 && (
              <NavigationMenu className={bp.desktopNav} viewport={false}>
                <NavigationMenuList>
                  {items.map((item) => (
                    <NavigationMenuItem key={item.href}>
                      <NavigationMenuLink
                        active={isActive(item)}
                        asChild
                        className={navigationMenuTriggerStyle()}
                      >
                        {item.external ? (
                          <a
                            href={item.href}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            {item.label}
                          </a>
                        ) : (
                          <Link href={item.href}>{item.label}</Link>
                        )}
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            )}
          </div>

          <div className="flex items-center gap-2">
            {right}
            {items.length > 0 && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    aria-label="Open menu"
                    className={bp.mobileTrigger}
                    size="icon"
                    variant="ghost"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <nav className="mt-6 flex flex-col gap-1 px-4">
                    {items.map((item) => (
                      <SheetClose asChild key={item.href}>
                        {item.external ? (
                          <a
                            className={MOBILE_LINK_CLASSES}
                            data-active={isActive(item)}
                            href={item.href}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            {item.label}
                          </a>
                        ) : (
                          <Link
                            className={MOBILE_LINK_CLASSES}
                            data-active={isActive(item)}
                            href={item.href}
                          >
                            {item.label}
                          </Link>
                        )}
                      </SheetClose>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
