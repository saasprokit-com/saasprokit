"use client";

import { DataTableContent } from "@repo/design-system/components/data-table/data-table-content";
import { DataTablePagination } from "@repo/design-system/components/data-table/pagination";
import type { ActionErrorMessages } from "@repo/internationalization";
import { use, useMemo } from "react";

import { useDataTable } from "@/hooks/use-data-table";
import type { GetListPayload } from "@/types/queries";
import type { AdminUserRow } from "../queries";
import { getUserColumns, userRoleFilterOptions } from "./users-columns";
import { UsersToolbar } from "./users-toolbar";

interface UsersTableProps {
  currentUserId: string;
  errors: ActionErrorMessages;
  usersPromise: Promise<GetListPayload<AdminUserRow>>;
}

const filterFields = [
  { id: "name", urlKey: "q", type: "string" as const },
  { id: "role", urlKey: "roles", type: "array" as const },
  { id: "banned", urlKey: "status", type: "string" as const },
];

export function UsersTable({
  usersPromise,
  currentUserId,
  errors,
}: UsersTableProps) {
  const { data, totalPage } = use(usersPromise);

  const columns = useMemo(
    () => getUserColumns({ currentUserId, errors }),
    [currentUserId, errors]
  );

  const { table } = useDataTable({
    data,
    columns,
    pageCount: totalPage || 1,
    filterFields,
  });

  return (
    <div className="flex flex-col gap-4">
      <UsersToolbar
        filters={[
          {
            columnId: "role",
            title: "Role",
            options: userRoleFilterOptions,
          },
        ]}
        table={table}
      />
      <DataTableContent table={table} />
      <DataTablePagination table={table} />
    </div>
  );
}
