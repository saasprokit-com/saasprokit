"use client";

import { ORG_ROLES } from "@repo/auth/permissions";
import { DataTableColumnHeader } from "@repo/design-system/components/data-table/column-header";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import type { ActionErrorMessages } from "@repo/internationalization";
import { INVITE_LINK_STATUS } from "@repo/utils/organization";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { Activity, Ban, Copy, Shield, User } from "lucide-react";
import { toast } from "sonner";
import type { InviteLink } from "../utils";
import {
  isInviteLinkExpired,
  isInviteLinkMaxedOut,
  TOKEN_PREVIEW_LENGTH,
} from "../utils";
import { InviteLinkActions } from "./invite-link-actions";

export const inviteLinkRoleFilterOptions = [
  { label: "Admin", value: ORG_ROLES.ADMIN, icon: Shield },
  { label: "Member", value: ORG_ROLES.MEMBER, icon: User },
];

export const inviteLinkStatusFilterOptions = [
  { label: "Active", value: INVITE_LINK_STATUS.ACTIVE, icon: Activity },
  { label: "Revoked", value: INVITE_LINK_STATUS.REVOKED, icon: Ban },
];

interface GetInviteLinkColumnsParams {
  errors: ActionErrorMessages;
  organizationId: string;
  baseUrl: string;
  canManage: boolean;
}

function getLinkStatusBadge(link: InviteLink) {
  if (!link.isActive) {
    return <Badge variant="secondary">Revoked</Badge>;
  }
  if (isInviteLinkExpired(link.expiresAt)) {
    return <Badge variant="destructive">Expired</Badge>;
  }
  if (isInviteLinkMaxedOut(link)) {
    return <Badge variant="secondary">Max uses reached</Badge>;
  }
  return (
    <Badge variant="default">
      Active
      {link.expiresAt &&
        ` • ${formatDistanceToNow(new Date(link.expiresAt), { addSuffix: true })}`}
    </Badge>
  );
}

export function getInviteLinkColumns({
  errors,
  organizationId,
  baseUrl,
  canManage,
}: GetInviteLinkColumnsParams): ColumnDef<InviteLink>[] {
  const columns: ColumnDef<InviteLink>[] = [];

  // Add select column if user can manage invite links
  if (canManage) {
    columns.push({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        return (
          <Checkbox
            aria-label="Select row"
            checked={isActive && row.getIsSelected()}
            disabled={!isActive}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    });
  }

  // Link (token preview) column
  columns.push({
    accessorKey: "token",
    header: "Link",
    cell: ({ row }) => {
      const token = row.original.token;
      const handleCopy = async () => {
        const url = `${baseUrl}/invite/${token}`;
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      };

      return (
        <div className="flex items-center gap-2">
          <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
            /invite/{token.slice(0, TOKEN_PREVIEW_LENGTH)}...
          </code>
          <Button
            className="h-6 w-6"
            onClick={handleCopy}
            size="icon"
            variant="ghost"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      );
    },
    enableSorting: false,
  });

  // Role column
  columns.push({
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => (
      <Badge className="capitalize" variant="outline">
        {row.original.role}
      </Badge>
    ),
  });

  // Uses column
  columns.push({
    accessorKey: "usedCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Uses" />
    ),
    cell: ({ row }) => {
      const link = row.original;
      return (
        <span className="text-muted-foreground">
          {link.usedCount}
          {link.maxUses == null ? null : ` / ${link.maxUses}`}
        </span>
      );
    },
  });

  // Created By column
  columns.push({
    accessorKey: "createdBy",
    header: "Created By",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.createdBy?.name ?? "Unknown"}
      </span>
    ),
    enableSorting: false,
  });

  // Status column
  columns.push({
    accessorKey: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => getLinkStatusBadge(row.original),
  });

  // Actions column
  if (canManage) {
    columns.push({
      id: "actions",
      cell: ({ row }) => (
        <InviteLinkActions
          baseUrl={baseUrl}
          errors={errors}
          inviteLink={row.original}
          organizationId={organizationId}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    });
  }

  return columns;
}
