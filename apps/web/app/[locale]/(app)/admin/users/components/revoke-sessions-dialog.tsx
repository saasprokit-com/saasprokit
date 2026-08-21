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
import { useActionState } from "react";
import { toast } from "sonner";

import { useActionResult } from "@/hooks/use-action-result";
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

  useActionResult(state, {
    onError: (error) => toast.error(error ?? errors.revokeUserSessions),
    onSuccess: () => {
      toast.success("Sessions revoked", {
        description: `${user.name || user.email} has been signed out of all sessions.`,
      });
      onOpenChange(false);
    },
  });

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
