"use client";

import { DataTableToolbar } from "@repo/design-system/components/data-table/toolbar";
import type { ActionErrorMessages } from "@repo/internationalization";
import { INVITATION_STATUS } from "@repo/utils/organization";
import type { Table } from "@tanstack/react-table";
import type { ComponentType } from "react";

import { SEARCH_DEBOUNCE_MS } from "../../utils";
import type { Invitation } from "../queries";
import { CancelInvitationsDialog } from "./cancel-invitations-dialog";

interface InvitationsToolbarProps {
  canManage: boolean;
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
  table: Table<Invitation>;
}

export function InvitationsToolbar({
  table,
  errors,
  organizationId,
  canManage,
  filters = [],
}: InvitationsToolbarProps) {
  // Get selected pending invitations for bulk cancel
  const selectedInvitations = table
    .getSelectedRowModel()
    .rows.map((row) => row.original)
    .filter((inv) => inv.status === INVITATION_STATUS.PENDING);

  const handleClearSelection = () => {
    table.resetRowSelection();
  };

  return (
    <DataTableToolbar
      actions={
        canManage &&
        selectedInvitations.length > 0 && (
          <CancelInvitationsDialog
            errors={errors}
            onSuccess={handleClearSelection}
            organizationId={organizationId}
            selectedInvitations={selectedInvitations}
          />
        )
      }
      filters={filters}
      searchDebounceMs={SEARCH_DEBOUNCE_MS}
      searchKey="email"
      searchPlaceholder="Filter invitations..."
      table={table}
    />
  );
}
