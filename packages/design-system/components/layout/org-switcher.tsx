"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@repo/design-system/components/ui/sidebar";
import { Building2, ChevronsUpDown, Pin, Plus } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Organization } from "./types";

type OrgSwitcherProps = {
  organizations: Organization[];
  activeOrganization?: Organization | null;
  defaultOrganizationId?: string | null;
  onOrganizationChange?: (org: Organization) => void;
  onCreateOrganization?: () => void;
  onSetDefault?: (organizationId: string) => void;
};

/**
 * Get the appropriate icon for an organization
 */
function OrgIcon({ org }: { org: Organization }) {
  if (org.logo) {
    // Image fills the parent container
    return (
      <Image
        alt={org.name}
        className="h-full w-full rounded object-cover"
        height={32}
        src={org.logo}
        width={32}
      />
    );
  }

  // Icon stays small and centered
  return <Building2 className="size-4 shrink-0" />;
}

export function OrgSwitcher({
  organizations,
  activeOrganization,
  defaultOrganizationId,
  onOrganizationChange,
  onCreateOrganization,
  onSetDefault,
}: OrgSwitcherProps) {
  const { isMobile } = useSidebar();
  const [activeOrg, setActiveOrg] = useState<Organization | null>(
    activeOrganization ?? organizations[0] ?? null
  );

  useEffect(() => {
    if (activeOrganization) {
      setActiveOrg(activeOrganization);
    }
  }, [activeOrganization]);

  const handleOrgChange = (org: Organization) => {
    setActiveOrg(org);
    onOrganizationChange?.(org);
  };

  const handlePinClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    orgId: string
  ) => {
    e.stopPropagation();
    // Only allow setting a new default, not unsetting
    if (orgId === defaultOrganizationId) {
      return;
    }
    onSetDefault?.(orgId);
  };

  // No orgs at all - show create prompt
  if (!activeOrg && organizations.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            onClick={onCreateOrganization}
            size="lg"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg border border-dashed">
              <Plus className="size-4" />
            </div>
            <div className="grid flex-1 text-start text-sm leading-tight">
              <span className="truncate font-semibold">Create Workspace</span>
              <span className="truncate text-muted-foreground text-xs">
                Get started
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Use first org as fallback if no active org
  const displayOrg = activeOrg ?? organizations[0];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              size="lg"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <OrgIcon org={displayOrg} />
              </div>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-semibold">
                  {displayOrg.name}
                </span>
                <span className="truncate text-muted-foreground text-xs">
                  {displayOrg.plan ?? `/${displayOrg.slug}`}
                </span>
              </div>
              <ChevronsUpDown className="ms-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Workspaces
            </DropdownMenuLabel>
            {organizations.map((org) => {
              const isDefault = org.id === defaultOrganizationId;
              return (
                <DropdownMenuItem
                  className="group gap-2 p-2"
                  key={org.id}
                  onClick={() => handleOrgChange(org)}
                >
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-sm border">
                    <OrgIcon org={org} />
                  </div>
                  <span className="flex-1 truncate">{org.name}</span>
                  {onSetDefault && isDefault && (
                    <span
                      className="rounded p-1 text-primary"
                      title="Default workspace"
                    >
                      <Pin className="size-3 fill-current" />
                    </span>
                  )}
                  {onSetDefault && !isDefault && (
                    <button
                      className="rounded p-1 text-muted-foreground opacity-0 hover:bg-accent group-hover:opacity-100"
                      onClick={(e) => handlePinClick(e, org.id)}
                      title="Set as default"
                      type="button"
                    >
                      <Pin className="size-3" />
                    </button>
                  )}
                </DropdownMenuItem>
              );
            })}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={onCreateOrganization}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                Create workspace
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
