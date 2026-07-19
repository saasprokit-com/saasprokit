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
import {
  Ban,
  Eye,
  LogIn,
  MoreHorizontal,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { adminRoutes } from "@/lib/routes";
import { unbanUserAction } from "../actions";
import type { AdminUserRow } from "../queries";
import { BanUserDialog } from "./ban-user-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { ImpersonateUserDialog } from "./impersonate-user-dialog";
import { RevokeSessionsDialog } from "./revoke-sessions-dialog";
import { SetRoleDialog } from "./set-role-dialog";

interface UserActionsProps {
  currentUserId: string;
  errors: ActionErrorMessages;
  user: AdminUserRow;
}

export function UserActions({ user, currentUserId, errors }: UserActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [setRoleOpen, setSetRoleOpen] = useState(false);
  const [banOpen, setBanOpen] = useState(false);
  const [impersonateOpen, setImpersonateOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isSelf = user.id === currentUserId;

  const handleUnban = () => {
    startTransition(async () => {
      try {
        const result = await unbanUserAction({ userId: user.id });
        if (result.success) {
          toast.success("User unbanned");
        } else {
          toast.error(result.error || errors.unbanUser);
        }
      } catch {
        toast.error(errors.unbanUser);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="h-8 w-8 p-0" disabled={isPending} variant="ghost">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={adminRoutes.user(user.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View details
            </Link>
          </DropdownMenuItem>

          {!isSelf && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSetRoleOpen(true)}>
                <UserCog className="mr-2 h-4 w-4" />
                Set role…
              </DropdownMenuItem>
              {user.banned ? (
                <DropdownMenuItem onClick={handleUnban}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Unban user
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setBanOpen(true)}>
                  <Ban className="mr-2 h-4 w-4" />
                  Ban user…
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setImpersonateOpen(true)}>
                <LogIn className="mr-2 h-4 w-4" />
                Impersonate…
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRevokeOpen(true)}>
                <ShieldOff className="mr-2 h-4 w-4" />
                Revoke sessions…
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete…
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {!isSelf && (
        <>
          <SetRoleDialog
            errors={errors}
            onOpenChange={setSetRoleOpen}
            open={setRoleOpen}
            user={user}
          />
          <BanUserDialog
            errors={errors}
            onOpenChange={setBanOpen}
            open={banOpen}
            user={user}
          />
          <ImpersonateUserDialog
            errors={errors}
            onOpenChange={setImpersonateOpen}
            open={impersonateOpen}
            user={user}
          />
          <RevokeSessionsDialog
            errors={errors}
            onOpenChange={setRevokeOpen}
            open={revokeOpen}
            user={user}
          />
          <DeleteUserDialog
            errors={errors}
            onOpenChange={setDeleteOpen}
            open={deleteOpen}
            user={user}
          />
        </>
      )}
    </>
  );
}
