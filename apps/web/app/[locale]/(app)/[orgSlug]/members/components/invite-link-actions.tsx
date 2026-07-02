"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import type { ActionErrorMessages } from "@repo/internationalization";
import { Copy, MoreHorizontal, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { revokeInviteLinkAction } from "../actions";
import type { InviteLink } from "../utils";
import { isInviteLinkExpired, isInviteLinkMaxedOut } from "../utils";

interface InviteLinkActionsProps {
  baseUrl: string;
  errors: ActionErrorMessages;
  inviteLink: InviteLink;
  organizationId: string;
}

export function InviteLinkActions({
  errors,
  inviteLink,
  organizationId,
  baseUrl,
}: InviteLinkActionsProps) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [isPending, startTransition] = useTransition();

  // Only show actions for active, non-expired, non-maxed links
  if (
    !inviteLink.isActive ||
    isInviteLinkExpired(inviteLink.expiresAt) ||
    isInviteLinkMaxedOut(inviteLink)
  ) {
    return null;
  }

  const handleCopy = async () => {
    const url = `${baseUrl}/invite/${inviteLink.token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const handleRevoke = () => {
    startTransition(async () => {
      try {
        const result = await revokeInviteLinkAction({
          inviteLinkId: inviteLink.id,
          organizationId,
          orgSlug,
        });
        if (result.success) {
          toast.success("Invite link revoked");
        } else {
          toast.error(result.error || errors.revokeInviteLink);
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
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="mr-2 h-4 w-4" />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={handleRevoke}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Revoke link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
