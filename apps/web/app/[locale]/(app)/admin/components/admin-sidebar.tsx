"use client";

import { NavGroup } from "@repo/design-system/components/layout/nav-group";
import { NavUser } from "@repo/design-system/components/layout/nav-user";
import type {
  NavGroup as NavGroupType,
  User,
} from "@repo/design-system/components/layout/types";
import { Badge } from "@repo/design-system/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@repo/design-system/components/ui/sidebar";
import { ArrowLeft, Building2, LayoutDashboard, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/lib/auth/actions";
import { accountRoutes, adminRoutes, PAGE_ROUTES } from "@/lib/routes";

interface AdminSidebarProps {
  /** Admins see the Users tab; moderators do not. */
  isAdmin: boolean;
  locale: string;
  user: User;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AdminSidebar({ user, locale, isAdmin }: AdminSidebarProps) {
  const router = useRouter();

  const adminNavGroups: NavGroupType[] = [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          url: `/${locale}${adminRoutes.dashboard()}`,
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Platform",
      items: [
        ...(isAdmin
          ? [
              {
                title: "Users",
                url: `/${locale}${adminRoutes.users()}`,
                icon: Users,
              },
            ]
          : []),
        {
          title: "Organizations",
          url: `/${locale}${adminRoutes.organizations()}`,
          icon: Building2,
        },
      ],
    },
  ];

  const handleSignOut = async () => {
    await signOutAction();
    router.push(`/${locale}`);
    router.refresh();
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <Link
          className="group mb-2 flex items-center gap-2 rounded-md px-2 py-2 font-medium text-muted-foreground text-xs transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          href={PAGE_ROUTES.ORG}
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span className="truncate">Back to app</span>
        </Link>
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground text-sm">
            {initialsOf(user.name)}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Admin</span>
              <Badge className="text-[10px]" variant="secondary">
                {isAdmin ? "Admin" : "Moderator"}
              </Badge>
            </div>
            <div className="truncate text-muted-foreground text-xs">
              Platform console
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {adminNavGroups.map((group) => (
          <NavGroup key={group.title} {...group} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          accountUrl={`/${locale}${accountRoutes.profile()}`}
          onSignOut={handleSignOut}
          securityUrl={`/${locale}${accountRoutes.security()}`}
          showDangerZone={false}
          user={user}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
