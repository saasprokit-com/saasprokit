"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import type { ActionErrorMessages } from "@repo/internationalization";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { removeUserAction } from "../actions";
import type { AdminUserRow } from "../queries";

interface DeleteUserDialogProps {
  errors: ActionErrorMessages;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  user: AdminUserRow;
}

export function DeleteUserDialog({
  user,
  errors,
  open,
  onOpenChange,
}: DeleteUserDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmEmail, setConfirmEmail] = useState("");

  const canDelete = confirmEmail === user.email;

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setConfirmEmail("");
    }
  };

  const handleConfirm = () => {
    if (!canDelete) {
      return;
    }
    startTransition(async () => {
      const result = await removeUserAction({ userId: user.id });
      if (result.success) {
        toast.success("User deleted");
        handleOpenChange(false);
      } else {
        toast.error(result.error || errors.deleteUser);
      }
    });
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete user</DialogTitle>
          <DialogDescription>
            This permanently deletes {user.name || user.email} and cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-destructive text-sm">
              Any organization solely owned by this user will be left without an
              owner — clean those up from the Organizations tab. Invitations
              they sent are removed.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-email">
              Type <strong>{user.email}</strong> to confirm
            </Label>
            <Input
              autoComplete="off"
              id="confirm-email"
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={user.email}
              value={confirmEmail}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => handleOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={!canDelete || isPending}
            onClick={handleConfirm}
            variant="destructive"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete user"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
