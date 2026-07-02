import type { LucideIcon } from "lucide-react";

export interface User {
  avatar?: string;
  email: string;
  name: string;
}

export interface Organization {
  id: string;
  logo?: string | null;
  name: string;
  plan?: string;
  slug: string;
}

export interface BaseNavItem {
  badge?: string;
  icon?: LucideIcon;
  title: string;
}

export type NavLink = BaseNavItem & {
  url: string;
  items?: never;
};

export type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: string })[];
  url?: never;
};

export type NavItem = NavCollapsible | NavLink;

export interface NavGroup {
  items: NavItem[];
  title: string;
}

export interface SidebarData {
  navGroups: NavGroup[];
  organizations: Organization[];
  user: User;
}
