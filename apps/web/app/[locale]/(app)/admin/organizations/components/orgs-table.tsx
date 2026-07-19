"use client";

import { DataTableContent } from "@repo/design-system/components/data-table/data-table-content";
import { DataTablePagination } from "@repo/design-system/components/data-table/pagination";
import type { ActionErrorMessages } from "@repo/internationalization";
import { use, useMemo } from "react";

import { useDataTable } from "@/hooks/use-data-table";
import type { GetListPayload } from "@/types/queries";
import type { AdminOrgRow } from "../queries";
import { getOrgColumns } from "./orgs-columns";
import { OrgsToolbar } from "./orgs-toolbar";

interface OrgsTableProps {
  errors: ActionErrorMessages;
  isAdmin: boolean;
  orgsPromise: Promise<GetListPayload<AdminOrgRow>>;
}

const filterFields = [
  { id: "name", urlKey: "q", type: "string" as const },
  { id: "plan", urlKey: "plans", type: "array" as const },
];

export function OrgsTable({ orgsPromise, errors, isAdmin }: OrgsTableProps) {
  const { data, totalPage } = use(orgsPromise);

  const columns = useMemo(
    () => getOrgColumns({ errors, isAdmin }),
    [errors, isAdmin]
  );

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
