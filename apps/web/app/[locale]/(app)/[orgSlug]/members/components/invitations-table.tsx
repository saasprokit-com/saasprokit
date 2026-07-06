"use client";

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
import { INVITATION_STATUS } from "@repo/utils/organization";
import { flexRender } from "@tanstack/react-table";
import { use, useMemo } from "react";

import { useDataTable } from "@/hooks/use-data-table";
import type { Invitation } from "../utils";
import {
  getInvitationColumns,
  invitationRoleFilterOptions,
  invitationStatusFilterOptions,
} from "./invitations-columns";
import { InvitationsToolbar } from "./invitations-toolbar";

interface InvitationsTableProps {
  canManage: boolean;
  errors: ActionErrorMessages;
  invitationsPromise: Promise<{
    invitations: Invitation[];
    totalCount: number;
    pageCount: number;
  }>;
  organizationId: string;
}

const filterFields = [
  { id: "email", urlKey: "q", type: "string" as const },
  { id: "role", urlKey: "role", type: "array" as const },
  { id: "status", urlKey: "status", type: "array" as const },
];

export function InvitationsTable({
  invitationsPromise,
  errors,
  organizationId,
  canManage,
}: InvitationsTableProps) {
  const { invitations, pageCount } = use(invitationsPromise);

  const columns = useMemo(
    () => getInvitationColumns({ errors, organizationId, canManage }),
    [errors, organizationId, canManage]
  );

  const { table } = useDataTable({
    data: invitations,
    columns,
    pageCount,
    filterFields,
    enableRowSelection: (row: Invitation) =>
      row.status === INVITATION_STATUS.PENDING,
  });

  return (
    <div className="flex flex-col gap-4">
      <InvitationsToolbar
        canManage={canManage}
        errors={errors}
        filters={[
          {
            columnId: "role",
            title: "Role",
            options: invitationRoleFilterOptions,
          },
          {
            columnId: "status",
            title: "Status",
            options: invitationStatusFilterOptions,
          },
        ]}
        organizationId={organizationId}
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
