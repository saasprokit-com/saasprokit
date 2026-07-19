"use client";

import { ADMIN_ROLES } from "@repo/auth/permissions";
import { DataTableColumnHeader } from "@repo/design-system/components/data-table/column-header";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/design-system/components/ui/avatar";
import { Badge } from "@repo/design-system/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";
import type { ActionErrorMessages } from "@repo/internationalization";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Shield, ShieldCheck, User, XCircle } from "lucide-react";
import type { AdminUserRow } from "../queries";
import { UserActions } from "./user-actions";

export const userRoleFilterOptions = [
  { label: "Admin", value: ADMIN_ROLES.ADMIN, icon: ShieldCheck },
  { label: "Moderator", value: ADMIN_ROLES.MODERATOR, icon: Shield },
  { label: "User", value: ADMIN_ROLES.USER, icon: User },
];

function getInitials(user: AdminUserRow): string {
  if (user.name) {
    return user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return user.email.slice(0, 2).toUpperCase();
}

function getRoleMeta(role: string | null): {
  label: string;
  icon: typeof ShieldCheck;
  variant: "default" | "secondary" | "outline";
} {
  const normalized = role || ADMIN_ROLES.USER;
  if (normalized.includes(ADMIN_ROLES.ADMIN)) {
    return { label: "admin", icon: ShieldCheck, variant: "default" };
  }
  if (normalized.includes(ADMIN_ROLES.MODERATOR)) {
    return { label: "moderator", icon: Shield, variant: "secondary" };
  }
  return { label: "user", icon: User, variant: "outline" };
}

interface GetUserColumnsParams {
  currentUserId: string;
  errors: ActionErrorMessages;
}

export function getUserColumns({
  currentUserId,
  errors,
}: GetUserColumnsParams): ColumnDef<AdminUserRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarImage
                alt={user.name ?? ""}
                src={user.image ?? undefined}
              />
              <AvatarFallback>{getInitials(user)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">
                {user.name || user.email.split("@")[0]}
              </span>
              <span className="text-muted-foreground text-xs">
                {user.email}
              </span>
            </div>
            {user.id === currentUserId && (
              <Badge className="text-xs" variant="secondary">
                You
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const meta = getRoleMeta(row.original.role);
        const Icon = meta.icon;
        return (
          <Badge className="gap-1 capitalize" variant={meta.variant}>
            <Icon className="size-3" />
            {meta.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "banned",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const { banned, banReason, banExpires } = row.original;
        if (!banned) {
          return <Badge variant="outline">Active</Badge>;
        }
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="destructive">Banned</Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p>{banReason || "No reason provided"}</p>
                <p className="text-muted-foreground">
                  {banExpires
                    ? `Expires ${formatDistanceToNow(new Date(banExpires), {
                        addSuffix: true,
                      })}`
                    : "Permanent"}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: "verified",
      header: "Verified",
      cell: ({ row }) =>
        row.original.emailVerified ? (
          <span className="flex items-center gap-1 text-muted-foreground text-sm">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span className="sr-only">Verified</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-muted-foreground text-sm">
            <XCircle className="size-4" />
            <span className="sr-only">Unverified</span>
          </span>
        ),
      enableSorting: false,
    },
    {
      id: "orgs",
      header: "Orgs",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original._count.members}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Joined" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: "lastActiveAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last active" />
      ),
      cell: ({ row }) => {
        const lastActive = row.original.lastActiveAt;
        if (!lastActive) {
          return <span className="text-muted-foreground">Never</span>;
        }
        return (
          <span className="text-muted-foreground">
            {formatDistanceToNow(new Date(lastActive), { addSuffix: true })}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <UserActions
          currentUserId={currentUserId}
          errors={errors}
          user={row.original}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
