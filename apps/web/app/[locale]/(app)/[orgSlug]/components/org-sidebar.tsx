"use client";

import { signOut } from "@repo/auth/client";
import { NavGroup } from "@repo/design-system/components/layout/nav-group";
import { NavUser } from "@repo/design-system/components/layout/nav-user";
import { OrgSwitcher } from "@repo/design-system/components/layout/org-switcher";
import type {
  NavGroup as NavGroupType,
  Organization,
  User,
} from "@repo/design-system/components/layout/types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@repo/design-system/components/ui/sidebar";
import { CreditCard, LayoutDashboard, Settings, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { orgRoutes, PAGE_ROUTES } from "@/lib/routes";
import { setDefaultWorkspaceAction } from "../actions";

interface OrgSidebarProps {
  activeOrganization?: Organization | null;
  canManageBilling: boolean;
  defaultOrganizationId?: string | null;
  locale: string;
  organizations: Organization[];
  orgSlug: string;
  user: User;
}

export function OrgSidebar({
  user,
  organizations,
  activeOrganization,
  defaultOrganizationId,
  locale,
  orgSlug,
  canManageBilling,
}: OrgSidebarProps) {
  const router = useRouter();
  const [_isPending, startTransition] = useTransition();

  // Build navigation items with org-specific URLs
  const orgNavGroups: NavGroupType[] = [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          url: orgRoutes.home(orgSlug),
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Organization",
      items: [
        {
          title: "Members",
          icon: Users,
          items: [
            {
              title: "Members",
              url: orgRoutes.members(orgSlug),
            },
            {
              title: "Invitations",
              url: orgRoutes.membersInvitations(orgSlug),
            },
            {
              title: "Invite Links",
              url: orgRoutes.membersInviteLinks(orgSlug),
            },
          ],
        },
        {
          title: "Settings",
          url: orgRoutes.settings(orgSlug),
          icon: Settings,
        },
        ...(canManageBilling
          ? [
              {
                title: "Billing",
                url: orgRoutes.billing(orgSlug),
                icon: CreditCard,
              },
            ]
          : []),
      ],
    },
  ];

  const handleOrganizationChange = (org: Organization) => {
    // Navigate to the new organization's dashboard
    router.push(orgRoutes.home(org.slug));
  };

  const handleCreateOrganization = () => {
    router.push(`/${locale}${PAGE_ROUTES.ACCOUNT_NEW_ORG}`);
  };

  const handleSetDefault = (organizationId: string) => {
    startTransition(async () => {
      await setDefaultWorkspaceAction(organizationId);
      router.refresh();
    });
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <OrgSwitcher
          activeOrganization={activeOrganization}
          defaultOrganizationId={defaultOrganizationId}
          onCreateOrganization={handleCreateOrganization}
          onOrganizationChange={handleOrganizationChange}
          onSetDefault={handleSetDefault}
          organizations={organizations}
        />
      </SidebarHeader>

      <SidebarContent>
        {orgNavGroups.map((group) => (
          <NavGroup key={group.title} {...group} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser onSignOut={handleSignOut} user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
