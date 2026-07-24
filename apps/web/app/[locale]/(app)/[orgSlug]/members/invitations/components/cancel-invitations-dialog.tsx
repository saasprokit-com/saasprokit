"use client";

import { ORG_ROLES } from "@repo/auth/permissions";
import {
  AlertDialog,
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
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/auth/auth";
import {
  type CancelInvitationsResult,
  cancelInvitationsAction,
} from "../actions";
import type { Invitation } from "../queries";

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
  const [open, setOpen] = useState(false);

  const count = selectedInvitations.length;

  const boundAction = cancelInvitationsAction.bind(null, {
    organizationId,
    orgSlug,
    invitationIds: selectedInvitations.map((inv) => inv.id),
  });

  const [state, formAction, isPending] = useActionState<
    ActionResult<CancelInvitationsResult> | null,
    FormData
  >(boundAction, null);

  useEffect(() => {
    if (!state) {
      return;
    }

    if (state.success) {
      toast.success("Invitations cancelled", {
        description: `Successfully cancelled ${state.data?.cancelledCount ?? 0} invitation(s)`,
      });
      setOpen(false);
      onSuccess();
    } else {
      toast.error(errors.cancelInvitations, {
        description: state.error ?? "Something went wrong",
      });
    }
  }, [state, errors.cancelInvitations, onSuccess]);

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
          <form action={formAction}>
            <Button
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
              type="submit"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Invitations"
              )}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
