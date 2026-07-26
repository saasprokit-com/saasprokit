"use client";

import { DataTableContent } from "@repo/design-system/components/data-table/data-table-content";
import { DataTablePagination } from "@repo/design-system/components/data-table/pagination";
import { use, useMemo } from "react";

import { useDataTable } from "@/hooks/use-data-table";
import type { GetListPayload } from "@/types/queries";
import type { AdminOrgRow } from "../queries";
import { getOrgColumns } from "./orgs-columns";
import { OrgsToolbar } from "./orgs-toolbar";

interface OrgsTableProps {
  orgsPromise: Promise<GetListPayload<AdminOrgRow>>;
}

const filterFields = [
  { id: "name", urlKey: "q", type: "string" as const },
  { id: "plan", urlKey: "plans", type: "array" as const },
];

export function OrgsTable({ orgsPromise }: OrgsTableProps) {
  const { data, totalPage } = use(orgsPromise);

  const columns = useMemo(() => getOrgColumns(), []);

  const { table } = useDataTable({
    data,
    columns,
    pageCount: totalPage || 1,
    filterFields,
  });

  return (
    <div className="flex flex-col gap-4">
      <OrgsToolbar table={table} />
      <DataTableContent table={table} />
      <DataTablePagination table={table} />
    </div>
  );
}
