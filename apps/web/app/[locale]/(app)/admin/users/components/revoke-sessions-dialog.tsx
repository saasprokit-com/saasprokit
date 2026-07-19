"use client";

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
import type { ActionErrorMessages } from "@repo/internationalization";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

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
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await revokeUserSessionsAction({ userId: user.id });
      if (result.success) {
        toast.success("Sessions revoked", {
          description: `${user.name || user.email} has been signed out of all sessions.`,
        });
        onOpenChange(false);
      } else {
        toast.error(result.error || errors.revokeUserSessions);
      }
    });
  };

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
          <AlertDialogAction
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Revoking...
              </>
            ) : (
              "Revoke sessions"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
