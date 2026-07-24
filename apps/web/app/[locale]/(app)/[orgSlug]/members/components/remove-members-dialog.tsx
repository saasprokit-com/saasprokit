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
import { Loader2, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { useActionResult } from "@/hooks/use-action-result";
import { removeMembersFormAction } from "../actions";
import type { Member } from "../queries";

interface RemoveMembersDialogProps {
  errors: ActionErrorMessages;
  onSuccess: () => void;
  organizationId: string;
  selectedMembers: Member[];
}

export function RemoveMembersDialog({
  errors,
  organizationId,
  selectedMembers,
  onSuccess,
}: RemoveMembersDialogProps) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [open, setOpen] = useState(false);

  const memberCount = selectedMembers.length;

  const boundAction = removeMembersFormAction.bind(null, {
    organizationId,
    orgSlug,
    memberIds: selectedMembers.map((m) => m.id),
  });
  const [state, formAction, isPending] = useActionState(boundAction, null);

  useActionResult(state, {
    onError: (error) =>
      toast.error(errors.removeMember, {
        description: error ?? "Something went wrong",
      }),
    onSuccess: (data) => {
      toast.success("Members removed", {
        description: `Successfully removed ${data?.removedCount ?? memberCount} member(s)`,
      });
      setOpen(false);
      onSuccess();
    },
  });

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <Button
        disabled={memberCount === 0}
        onClick={() => setOpen(true)}
        size="sm"
        variant="destructive"
      >
        <Trash2 className="mr-2 size-4" />
        Remove ({memberCount})
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Members</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove {memberCount} member
            {memberCount > 1 ? "s" : ""} from this organization? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="max-h-[200px] overflow-y-auto rounded-md border p-2">
          <ul className="space-y-1 text-sm">
            {selectedMembers.map((member) => (
              <li className="flex items-center gap-2" key={member.id}>
                <span className="font-medium">
                  {member.user.name ?? member.user.email}
                </span>
                <span className="text-muted-foreground">({member.role})</span>
              </li>
            ))}
          </ul>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <form action={formAction}>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
              type="submit"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Members"
              )}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
