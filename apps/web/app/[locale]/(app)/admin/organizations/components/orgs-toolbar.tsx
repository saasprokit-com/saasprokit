"use client";

import { DataTableToolbar } from "@repo/design-system/components/data-table/toolbar";
import type { Table } from "@tanstack/react-table";

import { SEARCH_DEBOUNCE_MS } from "../../../[orgSlug]/members/utils";
import type { AdminOrgRow } from "../queries";
import { planFilterOptions } from "./orgs-columns";

interface OrgsToolbarProps {
  table: Table<AdminOrgRow>;
}

export function OrgsToolbar({ table }: OrgsToolbarProps) {
  return (
    <DataTableToolbar
      filters={[
        { columnId: "plan", title: "Plan", options: planFilterOptions },
      ]}
      searchDebounceMs={SEARCH_DEBOUNCE_MS}
      searchKey="name"
      searchPlaceholder="Filter organizations..."
      table={table}
    />
  );
}
