"use client";

import { ORG_ROLES } from "@repo/auth/permissions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/design-system/components/ui/alert-dialog";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import type { ActionErrorMessages } from "@repo/internationalization";
import { Crown, MoreHorizontal, UserX } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { removeMembersAction, transferOwnershipAction } from "../actions";
import type { Member } from "../queries";
import type { MemberPermissions } from "../utils";

interface MemberActionsProps {
  currentUserId: string;
  errors: ActionErrorMessages;
  member: Member;
  organizationId: string;
  permissions: MemberPermissions;
}

export function MemberActions({
  member,
  currentUserId,
  errors,
  organizationId,
  permissions,
}: MemberActionsProps) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [isPending, startTransition] = useTransition();
  const [removeOpen, setRemoveOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  const isOwner = member.role === ORG_ROLES.OWNER;
  const isSelf = member.userId === currentUserId;
  // name can be empty for email-signup users; fall back to email so the
  // confirmation token is never blank (which would bypass the check)
  const confirmValue = member.user.name || member.user.email;

  // Cannot act on yourself or the owner
  if (isSelf || isOwner) {
    return null;
  }

  const handleRemove = () => {
    startTransition(async () => {
      try {
        const result = await removeMembersAction({
          memberIds: [member.id],
          organizationId,
          orgSlug,
        });
        if (result.success) {
          toast.success("Member removed");
          setRemoveOpen(false);
        } else {
          toast.error(result.error || errors.removeMember);
        }
      } catch {
        toast.error("An error occurred");
      }
    });
  };

  const handleTransfer = () => {
    if (confirmName !== confirmValue) {
      toast.error("Name does not match");
      return;
    }
    startTransition(async () => {
      try {
        const result = await transferOwnershipAction({
          newOwnerMemberId: member.id,
          organizationId,
          orgSlug,
        });
        if (result.success) {
          toast.success("Ownership transferred successfully");
          setTransferOpen(false);
          setConfirmName("");
        } else {
          toast.error(result.error || errors.transferOwnership);
        }
      } catch {
        toast.error("An error occurred");
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
          {permissions.canRemove && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setRemoveOpen(true)}
            >
              <UserX className="mr-2 h-4 w-4" />
              Remove member
            </DropdownMenuItem>
          )}

          {permissions.canTransferOwnership &&
            member.role !== ORG_ROLES.OWNER && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTransferOpen(true)}>
                  <Crown className="mr-2 h-4 w-4" />
                  Transfer ownership
                </DropdownMenuItem>
              </>
            )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Remove Confirmation */}
      <AlertDialog onOpenChange={setRemoveOpen} open={removeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              {member.user.name || member.user.email} from the organization?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
              onClick={handleRemove}
            >
              {isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Ownership Dialog */}
      <Dialog onOpenChange={setTransferOpen} open={transferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Transfer Ownership
            </DialogTitle>
            <DialogDescription>
              You are about to transfer ownership of this organization to{" "}
              <strong>{member.user.name || member.user.email}</strong>. This
              will make them the owner and you will become an admin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="font-medium text-destructive text-sm">
                Warning: This action cannot be undone by you. Only the new owner
                can transfer ownership back.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">
                Type <strong>{confirmValue}</strong> to confirm
              </Label>
              <Input
                id="confirm"
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={confirmValue}
                value={confirmName}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setTransferOpen(false);
                setConfirmName("");
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isPending || confirmName !== confirmValue}
              onClick={handleTransfer}
              variant="destructive"
            >
              {isPending ? "Transferring..." : "Transfer Ownership"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
