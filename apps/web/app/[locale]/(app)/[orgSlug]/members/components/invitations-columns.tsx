"use client";

import { ORG_ROLES } from "@repo/auth/permissions";
import { DataTableColumnHeader } from "@repo/design-system/components/data-table/column-header";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import type { ActionErrorMessages } from "@repo/internationalization";
import { INVITATION_STATUS } from "@repo/utils/organization";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { Ban, CheckCircle, Clock, Shield, User, XCircle } from "lucide-react";
import type { Invitation } from "../utils";
import { isInvitationExpired } from "../utils";
import { InvitationActions } from "./invitation-actions";

export const invitationRoleFilterOptions = [
  { label: "Admin", value: ORG_ROLES.ADMIN, icon: Shield },
  { label: "Member", value: ORG_ROLES.MEMBER, icon: User },
];

export const invitationStatusFilterOptions = [
  { label: "Pending", value: INVITATION_STATUS.PENDING, icon: Clock },
  { label: "Accepted", value: INVITATION_STATUS.ACCEPTED, icon: CheckCircle },
  { label: "Canceled", value: INVITATION_STATUS.CANCELED, icon: XCircle },
  { label: "Rejected", value: INVITATION_STATUS.REJECTED, icon: Ban },
];

interface GetInvitationColumnsParams {
  canManage: boolean;
  errors: ActionErrorMessages;
  organizationId: string;
}

export function getInvitationColumns({
  errors,
  organizationId,
  canManage,
}: GetInvitationColumnsParams): ColumnDef<Invitation>[] {
  const columns: ColumnDef<Invitation>[] = [];

  // Add select column if user can manage invitations
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
        const isPending = row.original.status === INVITATION_STATUS.PENDING;
        return (
          <Checkbox
            aria-label="Select row"
            checked={isPending && row.getIsSelected()}
            disabled={!isPending}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    });
  }

  // Email column
  columns.push({
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.email}</span>
    ),
  });

  // Role column
  columns.push({
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => (
      <Badge className="capitalize" variant="outline">
        {row.original.role || ORG_ROLES.MEMBER}
      </Badge>
    ),
  });

  // Invited By column
  columns.push({
    accessorKey: "inviter",
    header: "Invited By",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.inviter?.name ?? "Unknown"}
      </span>
    ),
    enableSorting: false,
  });

  // Sent column
  columns.push({
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sent" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatDistanceToNow(new Date(row.original.createdAt), {
          addSuffix: true,
        })}
      </span>
    ),
  });

  // Status column
  columns.push({
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const { status, expiresAt } = row.original;

      switch (status) {
        case INVITATION_STATUS.ACCEPTED:
          return <Badge variant="default">Accepted</Badge>;
        case INVITATION_STATUS.CANCELED:
          return <Badge variant="outline">Canceled</Badge>;
        case INVITATION_STATUS.REJECTED:
          return <Badge variant="destructive">Rejected</Badge>;
        default:
          if (isInvitationExpired(expiresAt)) {
            return <Badge variant="destructive">Expired</Badge>;
          }
          return (
            <Badge variant="secondary">
              Expires{" "}
              {formatDistanceToNow(new Date(expiresAt), { addSuffix: true })}
            </Badge>
          );
      }
    },
  });

  // Actions column
  if (canManage) {
    columns.push({
      id: "actions",
      cell: ({ row }) => (
        <InvitationActions
          errors={errors}
          invitation={row.original}
          organizationId={organizationId}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    });
  }

  return columns;
}
