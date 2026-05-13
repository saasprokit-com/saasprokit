"use client";

import { ORG_ROLES } from "@repo/auth/permissions";
import { DataTablePagination } from "@repo/design-system/components/data-table/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import type { ActionErrorMessages } from "@repo/internationalization";
import { flexRender } from "@tanstack/react-table";
import { use, useMemo } from "react";

import { useDataTable } from "@/hooks/use-data-table";
import type { MemberPermissions } from "../utils";
import { getColumns, type Member, roleFilterOptions } from "./columns";
import { MembersToolbar } from "./members-toolbar";

interface MembersTableProps {
  membersPromise: Promise<{
    members: Member[];
    totalCount: number;
    pageCount: number;
  }>;
  currentUserId: string;
  errors: ActionErrorMessages;
  organizationId: string;
  permissions: MemberPermissions;
}

const filterFields = [
  { id: "user", urlKey: "search", type: "string" as const },
  { id: "role", urlKey: "role", type: "array" as const },
];

export function MembersTable({
  membersPromise,
  currentUserId,
  errors,
  organizationId,
  permissions,
}: MembersTableProps) {
  const { members, pageCount } = use(membersPromise);

  const columns = useMemo(
    () => getColumns({ currentUserId, errors, organizationId, permissions }),
    [currentUserId, errors, organizationId, permissions]
  );

  const { table } = useDataTable({
    data: members,
    columns,
    pageCount,
    filterFields,
    enableRowSelection: (row: Member) =>
      row.role !== ORG_ROLES.OWNER && row.userId !== currentUserId,
  });

  return (
    <div className="flex flex-col gap-4">
      <MembersToolbar
        currentUserId={currentUserId}
        errors={errors}
        filters={[
          {
            columnId: "role",
            title: "Role",
            options: roleFilterOptions,
          },
        ]}
        organizationId={organizationId}
        permissions={permissions}
        table={table}
      />
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead colSpan={header.colSpan} key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
