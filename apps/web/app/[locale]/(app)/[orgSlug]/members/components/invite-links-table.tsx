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
import { flexRender } from "@tanstack/react-table";
import { use, useMemo } from "react";

import { useDataTable } from "@/hooks/use-data-table";
import type { InviteLink } from "../utils";
import {
  getInviteLinkColumns,
  inviteLinkRoleFilterOptions,
  inviteLinkStatusFilterOptions,
} from "./invite-links-columns";
import { InviteLinksToolbar } from "./invite-links-toolbar";

type InviteLinksTableProps = {
  inviteLinksPromise: Promise<{
    inviteLinks: InviteLink[];
    totalCount: number;
    pageCount: number;
  }>;
  errors: ActionErrorMessages;
  organizationId: string;
  baseUrl: string;
  canManage: boolean;
};

const filterFields = [
  { id: "token", urlKey: "search", type: "string" as const },
  { id: "role", urlKey: "role", type: "array" as const },
  { id: "isActive", urlKey: "status", type: "array" as const },
];

export function InviteLinksTable({
  inviteLinksPromise,
  errors,
  organizationId,
  baseUrl,
  canManage,
}: InviteLinksTableProps) {
  const { inviteLinks, pageCount } = use(inviteLinksPromise);

  const columns = useMemo(
    () => getInviteLinkColumns({ errors, organizationId, baseUrl, canManage }),
    [errors, organizationId, baseUrl, canManage]
  );

  const { table } = useDataTable({
    data: inviteLinks,
    columns,
    pageCount,
    filterFields,
    enableRowSelection: (row: InviteLink) => row.isActive,
  });

  return (
    <div className="flex flex-col gap-4">
      <InviteLinksToolbar
        canManage={canManage}
        errors={errors}
        filters={[
          {
            columnId: "role",
            title: "Role",
            options: inviteLinkRoleFilterOptions,
          },
          {
            columnId: "isActive",
            title: "Status",
            options: inviteLinkStatusFilterOptions,
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
