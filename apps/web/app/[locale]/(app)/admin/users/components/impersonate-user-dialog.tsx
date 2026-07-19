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
import { useParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { PAGE_ROUTES } from "@/lib/routes";
import { impersonateUserAction } from "../actions";
import type { AdminUserRow } from "../queries";

interface ImpersonateUserDialogProps {
  errors: ActionErrorMessages;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  user: AdminUserRow;
}

export function ImpersonateUserDialog({
  user,
  errors,
  open,
  onOpenChange,
}: ImpersonateUserDialogProps) {
  const { locale } = useParams<{ locale: string }>();
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        const result = await impersonateUserAction({ userId: user.id });
        if (result.success) {
          // Full navigation — the Next.js router cache still holds the old identity.
          window.location.assign(`/${locale}${PAGE_ROUTES.ORG}`);
        } else {
          toast.error(result.error || errors.impersonateUser);
        }
      } catch {
        toast.error(errors.impersonateUser);
      }
    });
  };

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Impersonate user</AlertDialogTitle>
          <AlertDialogDescription>
            You will be signed in as {user.name || user.email}. The
            impersonation session ends automatically after 1 hour, and a banner
            will remind you while it is active. Continue?
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
                Starting...
              </>
            ) : (
              "Impersonate"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
