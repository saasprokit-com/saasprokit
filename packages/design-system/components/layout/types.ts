import type { LucideIcon } from "lucide-react";

export interface User {
  name: string;
  email: string;
  avatar?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  plan?: string;
}

export interface BaseNavItem {
  title: string;
  badge?: string;
  icon?: LucideIcon;
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
  title: string;
  items: NavItem[];
}

export interface SidebarData {
  user: User;
  organizations: Organization[];
  navGroups: NavGroup[];
}
