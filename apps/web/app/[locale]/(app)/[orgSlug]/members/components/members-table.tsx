"use client";

import { ORG_ROLES } from "@repo/auth/permissions";
import { DataTableContent } from "@repo/design-system/components/data-table/data-table-content";
import { DataTablePagination } from "@repo/design-system/components/data-table/pagination";
import type { ActionErrorMessages } from "@repo/internationalization";
import { use, useMemo } from "react";
import { useDataTable } from "@/hooks/use-data-table";
import type { GetListPayload } from "@/types/queries";
import type { Member } from "../queries";
import type { MemberPermissions } from "../utils";
import { getColumns, roleFilterOptions } from "./members-columns";
import { MembersToolbar } from "./members-toolbar";

interface MembersTableProps {
  currentUserId: string;
  errors: ActionErrorMessages;
  membersPromise: Promise<GetListPayload<Member>>;
  organizationId: string;
  permissions: MemberPermissions;
}

const filterFields = [
  { id: "user", urlKey: "q", type: "string" as const },
  { id: "role", urlKey: "roles", type: "array" as const },
];

export function MembersTable({
  membersPromise,
  currentUserId,
  errors,
  organizationId,
  permissions,
}: MembersTableProps) {
  const { data: members, totalPage } = use(membersPromise);

  const columns = useMemo(
    () => getColumns({ currentUserId, errors, organizationId, permissions }),
    [currentUserId, errors, organizationId, permissions]
  );

  const { table } = useDataTable({
    data: members,
    columns,
    pageCount: totalPage || 1,
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
      <DataTableContent table={table} />
      <DataTablePagination table={table} />
    </div>
  );
}
