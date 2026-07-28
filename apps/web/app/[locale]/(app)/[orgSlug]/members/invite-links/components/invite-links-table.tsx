"use client";

import { DataTableContent } from "@repo/design-system/components/data-table/data-table-content";
import { DataTablePagination } from "@repo/design-system/components/data-table/pagination";
import type { ActionErrorMessages } from "@repo/internationalization";
import { use } from "react";
import { useDataTable } from "@/hooks/use-data-table";
import type { GetListPayload } from "@/types/queries";
import type { InviteLink } from "../queries";
import {
  getInviteLinkColumns,
  inviteLinkRoleFilterOptions,
  inviteLinkStatusFilterOptions,
} from "./invite-links-columns";
import { InviteLinksToolbar } from "./invite-links-toolbar";

interface InviteLinksTableProps {
  baseUrl: string;
  canManage: boolean;
  errors: ActionErrorMessages;
  inviteLinksPromise: Promise<GetListPayload<InviteLink>>;
  organizationId: string;
}

const filterFields = [
  { id: "token", urlKey: "q", type: "string" as const },
  { id: "role", urlKey: "roles", type: "array" as const },
  { id: "isActive", urlKey: "statuses", type: "array" as const },
];

export function InviteLinksTable({
  inviteLinksPromise,
  errors,
  organizationId,
  baseUrl,
  canManage,
}: InviteLinksTableProps) {
  const { data, totalPage } = use(inviteLinksPromise);

  const columns = getInviteLinkColumns({
    errors,
    organizationId,
    baseUrl,
    canManage,
  });

  const { table } = useDataTable({
    data,
    columns,
    pageCount: totalPage || 1,
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
      <DataTableContent table={table} />
      <DataTablePagination table={table} />
    </div>
  );
}
