"use client";

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
import { Loader2 } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/auth/auth";
import { revokeUserSessionsAction } from "../actions";

interface RevokeSessionsDialogProps {
  errors: ActionErrorMessages;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  user: { id: string; name: string; email: string };
}

export function RevokeSessionsDialog({
  user,
  errors,
  open,
  onOpenChange,
}: RevokeSessionsDialogProps) {
  const boundAction = revokeUserSessionsAction.bind(null, { userId: user.id });
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(boundAction, null);

  useEffect(() => {
    if (!state) {
      return;
    }
    if (state.success) {
      toast.success("Sessions revoked", {
        description: `${user.name || user.email} has been signed out of all sessions.`,
      });
      onOpenChange(false);
    } else if (state.error) {
      toast.error(state.error || errors.revokeUserSessions);
    }
  }, [state, errors.revokeUserSessions, onOpenChange, user.name, user.email]);

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke all sessions</AlertDialogTitle>
          <AlertDialogDescription>
            This signs {user.name || user.email} out of every active session on
            all devices. They will need to sign in again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <form action={formAction}>
            <Button disabled={isPending} type="submit">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                "Revoke sessions"
              )}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
