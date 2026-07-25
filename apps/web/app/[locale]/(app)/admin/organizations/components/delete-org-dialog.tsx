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
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/auth/auth";
import { deleteOrganizationAction } from "../actions";
import type { AdminOrgRow } from "../queries";

interface DeleteOrgDialogProps {
  errors: ActionErrorMessages;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  org: AdminOrgRow;
}

export function DeleteOrgDialog({
  errors,
  onOpenChange,
  open,
  org,
}: DeleteOrgDialogProps) {
  const router = useRouter();
  const [confirmValue, setConfirmValue] = useState("");

  const boundAction = deleteOrganizationAction.bind(null, {
    organizationId: org.id,
  });

  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(boundAction, null);

  const canDelete = confirmValue === org.slug;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setConfirmValue("");
    }
    onOpenChange(next);
  };

  useEffect(() => {
    if (!state) {
      return;
    }

    if (!state.success) {
      toast.error(errors.deleteOrganization, {
        description: state.error ?? "Something went wrong",
      });
      return;
    }

    toast.success("Organization deleted", {
      description: `${org.name} was permanently deleted.`,
    });
    setConfirmValue("");
    onOpenChange(false);
    router.refresh();
  }, [state, errors.deleteOrganization, onOpenChange, org.name, router]);

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete organization</DialogTitle>
          <DialogDescription>
            This permanently deletes{" "}
            <span className="font-medium">{org.name}</span> and all of its
            members, invitations, teams, and files. This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="confirm-slug">
            Type <span className="font-mono font-semibold">{org.slug}</span> to
            confirm
          </Label>
          <Input
            autoComplete="off"
            id="confirm-slug"
            onChange={(event) => setConfirmValue(event.target.value)}
            placeholder={org.slug}
            value={confirmValue}
          />
        </div>
        <DialogFooter>
          <Button
            disabled={isPending}
            onClick={() => handleOpenChange(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <form action={formAction}>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!canDelete || isPending}
              type="submit"
              variant="destructive"
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
