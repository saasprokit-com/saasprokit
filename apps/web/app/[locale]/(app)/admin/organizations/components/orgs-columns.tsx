"use client";

import { DataTableColumnHeader } from "@repo/design-system/components/data-table/column-header";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/design-system/components/ui/avatar";
import { Badge } from "@repo/design-system/components/ui/badge";
import type { ActionErrorMessages } from "@repo/internationalization";
import {
  PLAN_DISPLAY_NAMES,
  PLAN_NAMES,
  type PlanName,
} from "@repo/utils/payment";
import type { ColumnDef } from "@tanstack/react-table";
import type { AdminOrgRow } from "../queries";
import { OrgActions } from "./org-actions";

const ACTIVE_STATUS = "active";

export const planFilterOptions = [
  { label: PLAN_DISPLAY_NAMES[PLAN_NAMES.FREE], value: PLAN_NAMES.FREE },
  { label: PLAN_DISPLAY_NAMES[PLAN_NAMES.PRO], value: PLAN_NAMES.PRO },
  {
    label: PLAN_DISPLAY_NAMES[PLAN_NAMES.ENTERPRISE],
    value: PLAN_NAMES.ENTERPRISE,
  },
];

function initialsOf(value: string): string {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface GetOrgColumnsParams {
  errors: ActionErrorMessages;
  isAdmin: boolean;
}

export function getOrgColumns({ errors, isAdmin }: GetOrgColumnsParams) {
  const columns: ColumnDef<AdminOrgRow>[] = [];

  // Organization (logo + name + slug)
  columns.push({
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Organization" />
    ),
    cell: ({ row }) => {
      const org = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage alt={org.name} src={org.logo ?? undefined} />
            <AvatarFallback>{initialsOf(org.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{org.name}</span>
            <span className="font-mono text-muted-foreground text-xs">
              {org.slug}
            </span>
          </div>
        </div>
      );
    },
  });

  // Members count
  columns.push({
    id: "members",
    accessorFn: (row) => row._count.members,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Members" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original._count.members}
      </span>
    ),
  });

  // Plan
  columns.push({
    id: "plan",
    header: "Plan",
    cell: ({ row }) => {
      const { subscription } = row.original;
      const planLabel = subscription
        ? (PLAN_DISPLAY_NAMES[subscription.plan as PlanName] ??
          subscription.plan)
        : PLAN_DISPLAY_NAMES[PLAN_NAMES.FREE];
      const showStatus = subscription && subscription.status !== ACTIVE_STATUS;

      return (
        <div className="flex items-center gap-2">
          <Badge variant={subscription ? "default" : "outline"}>
            {planLabel}
          </Badge>
          {showStatus && (
            <Badge className="capitalize" variant="secondary">
              {subscription?.status ?? "unknown"}
            </Badge>
          )}
        </div>
      );
    },
    enableSorting: false,
  });

  // Created
  columns.push({
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {new Date(row.original.createdAt).toLocaleDateString()}
      </span>
    ),
  });

  // Actions
  columns.push({
    id: "actions",
    cell: ({ row }) => (
      <OrgActions errors={errors} isAdmin={isAdmin} org={row.original} />
    ),
    enableSorting: false,
    enableHiding: false,
  });

  return columns;
}
