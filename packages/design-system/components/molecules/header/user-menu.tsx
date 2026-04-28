"use client";

import { cn } from "@repo/design-system/lib/utils";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

export interface UserMenuUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface UserMenuItem {
  label: string;
  href: string;
  icon?: LucideIcon;
}

export interface UserMenuProps {
  user: UserMenuUser | null | undefined;
  menuItems?: UserMenuItem[];
  onLogout?: () => void | Promise<void>;
  loginHref?: string;
  signUpHref?: string;
  loginLabel?: string;
  signUpLabel?: string;
  logoutLabel?: string;
  className?: string;
}

function getInitials(name?: string | null): string {
  if (!name) {
    return "U";
  }
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserMenu({
  user,
  menuItems = [],
  onLogout,
  loginHref = "/auth/sign-in",
  signUpHref = "/auth/sign-up",
  loginLabel = "Login",
  signUpLabel = "Sign Up",
  logoutLabel = "Logout",
  className,
}: UserMenuProps) {
  if (!user) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <Button asChild variant="ghost">
          <Link href={loginHref}>{loginLabel}</Link>
        </Button>
        <Button asChild>
          <Link href={signUpHref}>{signUpLabel}</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn("relative size-8 rounded-full", className)}
          variant="ghost"
        >
          <Avatar className="size-8">
            <AvatarImage
              alt={user.name || "User"}
              src={user.image || undefined}
            />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-2 p-2">
          <Avatar className="size-8">
            <AvatarImage
              alt={user.name || "User"}
              src={user.image || undefined}
            />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1">
            <p className="font-medium text-sm leading-none">{user.name}</p>
            <p className="text-muted-foreground text-xs leading-none">
              {user.email}
            </p>
          </div>
        </div>
        {menuItems.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {menuItems.map((item) => (
              <DropdownMenuItem asChild key={item.href}>
                <Link href={item.href}>
                  {item.icon && <item.icon className="mr-2 size-4" />}
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </>
        )}
        {onLogout && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} variant="destructive">
              <LogOut className="mr-2 size-4" />
              {logoutLabel}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
