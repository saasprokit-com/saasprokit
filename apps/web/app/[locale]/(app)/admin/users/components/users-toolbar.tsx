"use client";

import { DataTableFacetedFilter } from "@repo/design-system/components/data-table/faceted-filter";
import { DataTableViewOptions } from "@repo/design-system/components/data-table/view-options";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { type ComponentType, useEffect, useState } from "react";

import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import type { AdminUserRow } from "../queries";

const SEARCH_DEBOUNCE_MS = 300;

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
  const isFiltered = table.getState().columnFilters.length > 0;

  const searchColumn = table.getColumn("name");
  const urlSearchValue = (searchColumn?.getFilterValue() as string) ?? "";
  const [searchInput, setSearchInput] = useState(urlSearchValue);

  // Sync local input from URL state on back/forward
  useEffect(() => {
    setSearchInput(urlSearchValue);
  }, [urlSearchValue]);

  const debouncedSetFilter = useDebouncedCallback((value: string) => {
    searchColumn?.setFilterValue(value || undefined);
  }, SEARCH_DEBOUNCE_MS);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchInput(value);
    debouncedSetFilter(value);
  };

  // Status is a single-value filter (all/active/banned) — a select, not a
  // multi-select facet, so it stays compatible with the string-literal URL param.
  const statusColumn = table.getColumn("banned");
  const statusValue = (statusColumn?.getFilterValue() as string) ?? "all";

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2">
        <Input
          className="h-8 w-[150px] lg:w-[250px]"
          onChange={handleSearchChange}
          placeholder="Filter users..."
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
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
