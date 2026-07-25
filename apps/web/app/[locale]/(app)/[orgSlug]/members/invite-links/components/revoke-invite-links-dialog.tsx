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
import { Loader2, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { useActionResult } from "@/hooks/use-action-result";
import type { ActionResult } from "@/lib/auth/auth";
import { TOKEN_PREVIEW_LENGTH } from "../../utils";
import { revokeInviteLinksAction } from "../actions";
import type { InviteLink } from "../queries";

interface RevokeInviteLinksDialogProps {
  errors: ActionErrorMessages;
  onSuccess: () => void;
  organizationId: string;
  selectedLinks: InviteLink[];
}

export function RevokeInviteLinksDialog({
  errors,
  organizationId,
  selectedLinks,
  onSuccess,
}: RevokeInviteLinksDialogProps) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [open, setOpen] = useState(false);

  const count = selectedLinks.length;

  const boundAction = revokeInviteLinksAction.bind(null, {
    organizationId,
    orgSlug,
    inviteLinkIds: selectedLinks.map((link) => link.id),
  });

  const [state, formAction, isPending] = useActionState<
    ActionResult<{ revokedCount: number }> | null,
    FormData
  >(boundAction, null);

  useActionResult(state, {
    onError: (error) =>
      toast.error(errors.revokeInviteLinks, {
        description: error ?? "Something went wrong",
      }),
    onSuccess: (data) => {
      toast.success("Invite links revoked", {
        description: `Successfully revoked ${data?.revokedCount ?? 0} invite link(s)`,
      });
      setOpen(false);
      onSuccess();
    },
  });

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <Button
        disabled={count === 0}
        onClick={() => setOpen(true)}
        size="sm"
        variant="destructive"
      >
        <XCircle className="mr-2 size-4" />
        Revoke ({count})
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke Invite Links</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to revoke {count} invite link
            {count > 1 ? "s" : ""}? Anyone with these links will no longer be
            able to join your organization.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="max-h-[200px] overflow-y-auto rounded-md border p-2">
          <ul className="space-y-1 text-sm">
            {selectedLinks.map((link) => (
              <li className="flex items-center gap-2" key={link.id}>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  /invite/{link.token.slice(0, TOKEN_PREVIEW_LENGTH)}...
                </code>
                <span className="text-muted-foreground capitalize">
                  ({link.role})
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
                  Revoking...
                </>
              ) : (
                "Revoke Links"
              )}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
