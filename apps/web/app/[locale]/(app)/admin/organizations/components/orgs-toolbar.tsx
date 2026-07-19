"use client";

import { DataTableFacetedFilter } from "@repo/design-system/components/data-table/faceted-filter";
import { DataTableViewOptions } from "@repo/design-system/components/data-table/view-options";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import type { AdminOrgRow } from "../queries";
import { planFilterOptions } from "./orgs-columns";

const SEARCH_DEBOUNCE_MS = 300;

interface OrgsToolbarProps {
  table: Table<AdminOrgRow>;
}

export function OrgsToolbar({ table }: OrgsToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const nameColumn = table.getColumn("name");
  const urlSearchValue = (nameColumn?.getFilterValue() as string) ?? "";
  const [searchInput, setSearchInput] = useState(urlSearchValue);

  // Sync local input from URL state on back/forward
  useEffect(() => {
    setSearchInput(urlSearchValue);
  }, [urlSearchValue]);

  const debouncedSetFilter = useDebouncedCallback((value: string) => {
    nameColumn?.setFilterValue(value || undefined);
  }, SEARCH_DEBOUNCE_MS);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchInput(value);
    debouncedSetFilter(value);
  };

  const planColumn = table.getColumn("plan");

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2">
        <Input
          className="h-8 w-[150px] lg:w-[250px]"
          onChange={handleSearchChange}
          placeholder="Filter organizations..."
          value={searchInput}
        />
        {planColumn && (
          <DataTableFacetedFilter
            column={planColumn}
            options={planFilterOptions}
            title="Plan"
          />
        )}
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
