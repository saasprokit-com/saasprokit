"use client";

import { DataTableToolbar } from "@repo/design-system/components/data-table/toolbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import type { Table } from "@tanstack/react-table";
import type { ComponentType } from "react";

import { SEARCH_DEBOUNCE_MS } from "../../../[orgSlug]/members/utils";
import type { AdminUserRow } from "../queries";

const statusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Banned", value: "banned" },
];

interface UsersToolbarProps {
  filters?: {
    columnId: string;
    title: string;
    options: {
      label: string;
      value: string;
      icon?: ComponentType<{ className?: string }>;
    }[];
  }[];
  table: Table<AdminUserRow>;
}

export function UsersToolbar({ table, filters = [] }: UsersToolbarProps) {
  // Status is a single-value filter (all/active/banned) — a select, not a
  // multi-select facet, so it stays compatible with the string-literal URL param.
  const statusColumn = table.getColumn("banned");
  const statusValue = (statusColumn?.getFilterValue() as string) ?? "all";

  return (
    <DataTableToolbar
      extraFilters={
        <Select
          onValueChange={(value) =>
            statusColumn?.setFilterValue(value === "all" ? undefined : value)
          }
          value={statusValue}
        >
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
      filters={filters}
      searchDebounceMs={SEARCH_DEBOUNCE_MS}
      searchKey="name"
      searchPlaceholder="Filter users..."
      table={table}
    />
  );
}
