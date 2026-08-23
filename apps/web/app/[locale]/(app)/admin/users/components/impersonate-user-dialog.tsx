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
import { useParams } from "next/navigation";
import { useActionState } from "react";
import { toast } from "sonner";

import { useActionResult } from "@/hooks/use-action-result";
import type { ActionResult } from "@/lib/auth/auth";
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

  const boundAction = impersonateUserAction.bind(null, { userId: user.id });
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(boundAction, null);

  useActionResult(state, {
    onError: (error) => toast.error(error ?? errors.impersonateUser),
    onSuccess: () => {
      // Full navigation — the Next.js router cache still holds the old identity.
      window.location.assign(`/${locale}${PAGE_ROUTES.ORG}`);
    },
  });

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
          <form action={formAction}>
            <Button disabled={isPending} type="submit">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Starting...
                </>
              ) : (
                "Impersonate"
              )}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
