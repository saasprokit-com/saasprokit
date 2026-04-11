import type { LucideIcon } from "lucide-react";

export type User = {
  name: string;
  email: string;
  avatar?: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  plan?: string;
};

export type BaseNavItem = {
  title: string;
  badge?: string;
  icon?: LucideIcon;
};

export type NavLink = BaseNavItem & {
  url: string;
  items?: never;
};

export type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: string })[];
  url?: never;
};

export type NavItem = NavCollapsible | NavLink;

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export type SidebarData = {
  user: User;
  organizations: Organization[];
  navGroups: NavGroup[];
};
