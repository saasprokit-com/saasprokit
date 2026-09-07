"use client";

import { ORG_ROLES } from "@repo/auth/permissions";
import { DataTableFacetedFilter } from "@repo/design-system/components/data-table/faceted-filter";
import { DataTableViewOptions } from "@repo/design-system/components/data-table/view-options";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import type { ActionErrorMessages } from "@repo/internationalization";
import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { type ComponentType, useEffect, useState } from "react";

import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import type { Member } from "../queries";
import type { MemberPermissions } from "../utils";
import { SEARCH_DEBOUNCE_MS } from "../utils";
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
  const isFiltered = table.getState().columnFilters.length > 0;

  // Local search input state (debounced before updating URL)
  const searchColumn = table.getColumn("user");
  const searchFilterValue = (searchColumn?.getFilterValue() as string) ?? "";

  const [searchInput, setSearchInput] = useState(searchFilterValue);

  // Sync local input from URL state (browser back/forward)
  useEffect(() => {
    setSearchInput(searchFilterValue);
  }, [searchFilterValue]);

  const debouncedSetFilter = useDebouncedCallback((value: string) => {
    searchColumn?.setFilterValue(value || undefined);
  }, SEARCH_DEBOUNCE_MS);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchInput(value);
    debouncedSetFilter(value);
  };

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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Input
            className="h-8 w-[150px] lg:w-[250px]"
            onChange={handleSearchChange}
            placeholder="Filter members..."
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
          <DataTableViewOptions table={table} />
        </div>
      </div>
    </div>
  );
}
