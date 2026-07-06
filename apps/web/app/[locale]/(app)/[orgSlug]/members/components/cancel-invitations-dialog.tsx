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
import type { ActionErrorMessages } from "@repo/internationalization";
import { Loader2, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cancelInvitationsAction } from "../actions";
import type { Invitation } from "../invitations/queries";

interface CancelInvitationsDialogProps {
  errors: ActionErrorMessages;
  onSuccess: () => void;
  organizationId: string;
  selectedInvitations: Invitation[];
}

export function CancelInvitationsDialog({
  errors,
  organizationId,
  selectedInvitations,
  onSuccess,
}: CancelInvitationsDialogProps) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const count = selectedInvitations.length;

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await cancelInvitationsAction({
        organizationId,
        orgSlug,
        invitationIds: selectedInvitations.map((inv) => inv.id),
      });

      if (result.success) {
        toast.success("Invitations cancelled", {
          description: `Successfully cancelled ${result.data?.cancelledCount ?? count} invitation(s)`,
        });
        setOpen(false);
        onSuccess();
      } else {
        toast.error(errors.cancelInvitations, {
          description: result.error ?? "Something went wrong",
        });
      }
    });
  };

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <Button
        disabled={count === 0}
        onClick={() => setOpen(true)}
        size="sm"
        variant="destructive"
      >
        <XCircle className="mr-2 size-4" />
        Cancel ({count})
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Invitations</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel {count} invitation
            {count > 1 ? "s" : ""}? The invited users will no longer be able to
            join with these invitations.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="max-h-[200px] overflow-y-auto rounded-md border p-2">
          <ul className="space-y-1 text-sm">
            {selectedInvitations.map((invitation) => (
              <li className="flex items-center gap-2" key={invitation.id}>
                <span className="font-medium">{invitation.email}</span>
                <span className="text-muted-foreground capitalize">
                  ({invitation.role ?? ORG_ROLES.MEMBER})
                </span>
              </li>
            ))}
          </ul>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Close</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Cancel Invitations"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
