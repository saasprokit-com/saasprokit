"use client";

import { ORG_ROLES } from "@repo/auth/permissions";
import { DataTableToolbar } from "@repo/design-system/components/data-table/toolbar";
import type { ActionErrorMessages } from "@repo/internationalization";
import type { Table } from "@tanstack/react-table";
import type { ComponentType } from "react";

import type { Member } from "../queries";
import { type MemberPermissions, SEARCH_DEBOUNCE_MS } from "../utils";
import { BulkInviteDialog } from "./bulk-invite-dialog";
import { InviteMemberDialog } from "./invite-member-dialog";
import { RemoveMembersDialog } from "./remove-members-dialog";

interface MembersToolbarProps {
  currentUserId: string;
  errors: ActionErrorMessages;
  filters?: {
    columnId: string;
    title: string;
    options: {
      label: string;
      value: string;
      icon?: ComponentType<{ className?: string }>;
    }[];
  }[];
  organizationId: string;
  permissions: MemberPermissions;
  table: Table<Member>;
}

export function MembersToolbar({
  table,
  errors,
  organizationId,
  currentUserId,
  permissions,
  filters = [],
}: MembersToolbarProps) {
  // Get selected rows that can actually be removed (not owners, not self)
  const selectedRows = table.getSelectedRowModel().rows;
  const removableMembers = selectedRows
    .map((row) => row.original)
    .filter(
      (member) =>
        member.role !== ORG_ROLES.OWNER && member.userId !== currentUserId
    );

  const handleClearSelection = () => {
    table.resetRowSelection();
  };

  return (
    <DataTableToolbar
      actions={
        <>
          {permissions.canRemove && removableMembers.length > 0 && (
            <RemoveMembersDialog
              errors={errors}
              onSuccess={handleClearSelection}
              organizationId={organizationId}
              selectedMembers={removableMembers}
            />
          )}
          {permissions.canInvite && (
            <>
              <BulkInviteDialog
                errors={errors}
                organizationId={organizationId}
              />
              <InviteMemberDialog
                errors={errors}
                organizationId={organizationId}
              />
            </>
          )}
        </>
      }
      filters={filters}
      searchDebounceMs={SEARCH_DEBOUNCE_MS}
      searchKey="user"
      searchPlaceholder="Filter members..."
      table={table}
    />
  );
}
