"use client";

import { DataTableFacetedFilter } from "@repo/design-system/components/data-table/faceted-filter";
import { DataTableViewOptions } from "@repo/design-system/components/data-table/view-options";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import type { ActionErrorMessages } from "@repo/internationalization";
import { INVITATION_STATUS } from "@repo/utils/organization";
import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { type ComponentType, useEffect, useState } from "react";

import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import type { Invitation } from "../invitations/queries";
import { SEARCH_DEBOUNCE_MS } from "../utils";
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
  const isFiltered = table.getState().columnFilters.length > 0;

  const emailColumn = table.getColumn("email");
  const urlSearchValue = (emailColumn?.getFilterValue() as string) ?? "";
  const [searchInput, setSearchInput] = useState(urlSearchValue);

  // Sync local input from URL state on back/forward
  useEffect(() => {
    setSearchInput(urlSearchValue);
  }, [urlSearchValue]);

  const debouncedSetFilter = useDebouncedCallback((value: string) => {
    emailColumn?.setFilterValue(value || undefined);
  }, SEARCH_DEBOUNCE_MS);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchInput(value);
    debouncedSetFilter(value);
  };

  // Get selected pending invitations for bulk cancel
  const selectedInvitations = table
    .getSelectedRowModel()
    .rows.map((row) => row.original)
    .filter((inv) => inv.status === INVITATION_STATUS.PENDING);

  const handleClearSelection = () => {
    table.resetRowSelection();
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2">
        <Input
          className="h-8 w-[150px] lg:w-[250px]"
          onChange={handleSearchChange}
          placeholder="Filter invitations..."
          value={searchInput}
        />
        {filters.map((filter) => {
          const column = table.getColumn(filter.columnId);
          if (!column) {
            return null;
          }
          return (
            <DataTableFacetedFilter
              column={column}
              key={filter.columnId}
              options={filter.options}
              title={filter.title}
            />
          );
        })}
        {isFiltered && (
          <Button
            onClick={() => {
              table.resetColumnFilters();
              setSearchInput("");
            }}
            size="sm"
            variant="ghost"
          >
            Reset
            <X />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {canManage && selectedInvitations.length > 0 && (
          <CancelInvitationsDialog
            errors={errors}
            onSuccess={handleClearSelection}
            organizationId={organizationId}
            selectedInvitations={selectedInvitations}
          />
        )}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
