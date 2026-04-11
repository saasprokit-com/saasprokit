"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import type { ActionErrorMessages } from "@repo/internationalization";
import { INVITATION_STATUS } from "@repo/utils/organization";
import { MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { cancelInvitationAction, resendInvitationAction } from "../actions";
import type { Invitation } from "../utils";

type InvitationActionsProps = {
  errors: ActionErrorMessages;
  invitation: Invitation;
  organizationId: string;
};

export function InvitationActions({
  errors,
  invitation,
  organizationId,
}: InvitationActionsProps) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [isPending, startTransition] = useTransition();

  if (invitation.status !== INVITATION_STATUS.PENDING) {
    return null;
  }

  const handleResend = () => {
    startTransition(async () => {
      try {
        const result = await resendInvitationAction({
          invitationId: invitation.id,
          organizationId,
          orgSlug,
        });
        if (result.success) {
          toast.success("Invitation resent successfully");
        } else {
          toast.error(result.error || errors.resendInvitation);
        }
      } catch {
        toast.error("An error occurred");
      }
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      try {
        const result = await cancelInvitationAction({
          invitationId: invitation.id,
          organizationId,
          orgSlug,
        });
        if (result.success) {
          toast.success("Invitation cancelled");
        } else {
          toast.error(result.error || errors.cancelInvitation);
        }
      } catch {
        toast.error("An error occurred");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-8 w-8 p-0" disabled={isPending} variant="ghost">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleResend}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Resend invitation
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={handleCancel}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Cancel invitation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
