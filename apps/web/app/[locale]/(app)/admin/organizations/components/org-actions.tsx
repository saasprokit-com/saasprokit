"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import type { ActionErrorMessages } from "@repo/internationalization";
import { Eye, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { adminRoutes } from "@/lib/routes";
import type { AdminOrgRow } from "../queries";
import { DeleteOrgDialog } from "./delete-org-dialog";

interface OrgActionsProps {
  errors: ActionErrorMessages;
  isAdmin: boolean;
  org: AdminOrgRow;
}

export function OrgActions({ errors, isAdmin, org }: OrgActionsProps) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="h-8 w-8 p-0" variant="ghost">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={adminRoutes.organization(org.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View details
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete…
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {isAdmin && (
        <DeleteOrgDialog
          errors={errors}
          onOpenChange={setShowDelete}
          open={showDelete}
          org={org}
        />
      )}
    </>
  );
}
