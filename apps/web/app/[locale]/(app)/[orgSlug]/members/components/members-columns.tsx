"use client";

import { ORG_ROLES, type OrgRoleName } from "@repo/auth/permissions";
import { DataTableColumnHeader } from "@repo/design-system/components/data-table/column-header";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/design-system/components/ui/avatar";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import { formatDate } from "@repo/design-system/lib/date";
import type { ActionErrorMessages } from "@repo/internationalization";
import type { ColumnDef } from "@tanstack/react-table";
import { Crown, Shield, User } from "lucide-react";
import type { Member } from "../queries";
import type { MemberPermissions } from "../utils";
import { MemberActions } from "./member-actions";
import { RoleSelector } from "./role-selector";

export const roleFilterOptions = [
  { label: "Owner", value: ORG_ROLES.OWNER, icon: Crown },
  { label: "Admin", value: ORG_ROLES.ADMIN, icon: Shield },
  { label: "Member", value: ORG_ROLES.MEMBER, icon: User },
];

interface GetColumnsParams {
  currentUserId: string;
  errors: ActionErrorMessages;
  organizationId: string;
  permissions: MemberPermissions;
}

export function getColumns({
  currentUserId,
  errors,
  organizationId,
  permissions,
}: GetColumnsParams) {
  const columns: ColumnDef<Member>[] = [];

  // Add select column if user can remove members
  if (permissions.canRemove) {
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
        const member = row.original;
        const isOwner = member.role === ORG_ROLES.OWNER;
        const isSelf = member.userId === currentUserId;
        const isProtected = isOwner || isSelf;

        return (
          <Checkbox
            aria-label="Select row"
            checked={!isProtected && row.getIsSelected()}
            disabled={isProtected}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    });
  }

  // Member column
  columns.push({
    accessorKey: "user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Member" />
    ),
    cell: ({ row }) => {
      const member = row.original;
      const initials = member?.user?.name
        ? member.user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : (member.user.email?.slice(0, 2).toUpperCase() ?? "");

      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage
              alt={member.user.name ?? ""}
              src={member.user.image ?? undefined}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">
              {(member.user.name || member?.user?.email.split("@")[0]) ??
                "Unknown"}
            </span>
          </div>
          {member.userId === currentUserId && (
            <Badge className="text-xs" variant="secondary">
              You
            </Badge>
          )}
        </div>
      );
    },
  });

  // Email column
  columns.push({
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.user.email}</span>
    ),
  });

  // Role column with inline editing
  columns.push({
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => {
      const member = row.original;
      const isOwner = member.role === ORG_ROLES.OWNER;
      const isSelf = member.userId === currentUserId;

      return (
        <RoleSelector
          canUpdateRole={permissions.canUpdateRole}
          currentRole={member.role as OrgRoleName}
          errors={errors}
          isOwner={isOwner}
          isSelf={isSelf}
          memberId={member.id}
          organizationId={organizationId}
        />
      );
    },
  });

  // Joined column
  columns.push({
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Joined" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  });

  // Actions column
  if (permissions.canRemove) {
    columns.push({
      id: "actions",
      cell: ({ row }) => {
        const member = row.original;
        return (
          <MemberActions
            currentUserId={currentUserId}
            errors={errors}
            member={member}
            organizationId={organizationId}
            permissions={permissions}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    });
  }

  return columns;
}
