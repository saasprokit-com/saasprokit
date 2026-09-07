"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import type { ComponentType } from "react";
import { DataTableFacetedFilter } from "./faceted-filter";
import { DataTableViewOptions } from "./view-options";

interface DataTableToolbarProps<TData> {
  filters?: {
    columnId: string;
    title: string;
    options: {
      label: string;
      value: string;
      icon?: ComponentType<{ className?: string }>;
    }[];
  }[];
  searchKey?: string;
  searchPlaceholder?: string;
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Filter...",
  filters = [],
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2">
        {searchKey && (
          <Input
            className="h-8 w-[150px] lg:w-[250px]"
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            placeholder={searchPlaceholder}
            value={
              (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
            }
          />
        )}
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
            onClick={() => table.resetColumnFilters()}
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
