"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { DataTableFacetedFilter } from "./faceted-filter";
import { DataTableViewOptions } from "./view-options";

interface DataTableToolbarProps<TData> {
  actions?: ReactNode;
  extraFilters?: ReactNode;
  filters?: {
    columnId: string;
    title: string;
    options: {
      label: string;
      value: string;
      icon?: ComponentType<{ className?: string }>;
    }[];
  }[];
  searchDebounceMs?: number;
  searchKey?: string;
  searchPlaceholder?: string;
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Filter...",
  searchDebounceMs = 300,
  filters = [],
  extraFilters,
  actions,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const searchColumn = searchKey ? table.getColumn(searchKey) : undefined;
  const urlSearchValue = (searchColumn?.getFilterValue() as string) ?? "";
  const [searchInput, setSearchInput] = useState(urlSearchValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchInput(urlSearchValue);
  }, [urlSearchValue]);

  useEffect(
    () => () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    },
    []
  );

  const handleReset = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    table.resetColumnFilters();
    setSearchInput("");
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2">
        {searchKey && (
          <Input
            className="h-8 w-[150px] lg:w-[250px]"
            onChange={(event) => {
              const value = event.target.value;
              setSearchInput(value);
              if (debounceRef.current) {
                clearTimeout(debounceRef.current);
              }
              debounceRef.current = setTimeout(() => {
                searchColumn?.setFilterValue(value || undefined);
              }, searchDebounceMs);
            }}
            placeholder={searchPlaceholder}
            value={searchInput}
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
        {extraFilters}
        {isFiltered && (
          <Button onClick={handleReset} size="sm" variant="ghost">
            Reset
            <X />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
