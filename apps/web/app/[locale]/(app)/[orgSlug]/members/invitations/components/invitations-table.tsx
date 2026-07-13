"use client";

import { DataTableContent } from "@repo/design-system/components/data-table/data-table-content";
import { DataTablePagination } from "@repo/design-system/components/data-table/pagination";
import type { ActionErrorMessages } from "@repo/internationalization";
import { INVITATION_STATUS } from "@repo/utils/organization";
import { use, useMemo } from "react";

import { useDataTable } from "@/hooks/use-data-table";
import type { GetListPayload } from "@/types/queries";
import type { Invitation } from "../queries";
import {
  getInvitationColumns,
  invitationRoleFilterOptions,
  invitationStatusFilterOptions,
} from "./invitations-columns";
import { InvitationsToolbar } from "./invitations-toolbar";

interface InvitationsTableProps {
  canManage: boolean;
  errors: ActionErrorMessages;
  invitationsPromise: Promise<GetListPayload<Invitation>>;
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
  const { data, totalPage } = use(invitationsPromise);

  const columns = useMemo(
    () => getInvitationColumns({ errors, organizationId, canManage }),
    [errors, organizationId, canManage]
  );

  const { table } = useDataTable({
    data,
    columns,
    pageCount: totalPage || 1,
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
      <DataTableContent table={table} />
      <DataTablePagination table={table} />
    </div>
  );
}
