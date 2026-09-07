"use client";

import { NavGroup } from "@repo/design-system/components/layout/nav-group";
import { NavUser } from "@repo/design-system/components/layout/nav-user";
import type {
  NavGroup as NavGroupType,
  User,
} from "@repo/design-system/components/layout/types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@repo/design-system/components/ui/sidebar";
import {
  ArrowLeft,
  Lock,
  ShieldCheck,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/lib/auth/actions";
import { accountRoutes, adminRoutes, PAGE_ROUTES } from "@/lib/routes";

interface AccountSidebarProps {
  locale: string;
  /** When true, the signed-in user is platform staff; shows an Administration link. */
  showAdmin?: boolean;
  user: User;
}

export function AccountSidebar({
  user,
  locale,
  showAdmin,
}: AccountSidebarProps) {
  const router = useRouter();

  // Build navigation items with locale-aware URLs
  const accountNavGroups: NavGroupType[] = [
    {
      title: "Account",
      items: [
        {
          title: "Profile",
          url: `/${locale}${accountRoutes.profile()}`,
          icon: UserIcon,
        },
        {
          title: "Security",
          url: `/${locale}${accountRoutes.security()}`,
          icon: Lock,
        },
        {
          title: "Danger Zone",
          url: `/${locale}${accountRoutes.danger()}`,
          icon: Trash2,
        },
      ],
    },
    ...(showAdmin
      ? [
          {
            title: "Administration",
            items: [
              {
                title: "Admin Console",
                url: `/${locale}${adminRoutes.dashboard()}`,
                icon: ShieldCheck,
              },
            ],
          },
        ]
      : []),
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
          <span className="truncate">Organization</span>
        </Link>
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground text-sm">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="font-semibold text-sm">{user.name}</div>
            <div className="truncate text-muted-foreground text-xs">
              {user.email}
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {accountNavGroups.map((group) => (
          <NavGroup key={group.title} {...group} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          accountUrl={`/${locale}${accountRoutes.profile()}`}
          dangerUrl={`/${locale}${accountRoutes.danger()}`}
          onSignOut={handleSignOut}
          securityUrl={`/${locale}${accountRoutes.security()}`}
          user={user}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
