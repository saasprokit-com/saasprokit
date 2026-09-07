"use client";

import type { ActionErrorMessages } from "@repo/internationalization";
import { Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { removeMembersFormAction } from "../actions";
import type { Member } from "../queries";
import { BulkConfirmDialog } from "./bulk-confirm-dialog";

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
  const memberCount = selectedMembers.length;

  return (
    <BulkConfirmDialog<Member, { removedCount: number }>
      action={removeMembersFormAction.bind(null, {
        organizationId,
        orgSlug,
        memberIds: selectedMembers.map((m) => m.id),
      })}
      cancelLabel="Cancel"
      confirmLabel="Remove Members"
      description={`Are you sure you want to remove ${memberCount} member${memberCount > 1 ? "s" : ""} from this organization? This action cannot be undone.`}
      errorTitle={errors.removeMember}
      items={selectedMembers}
      onSuccess={onSuccess}
      pendingLabel="Removing..."
      renderItem={(member) => (
        <>
          <span className="font-medium">
            {member.user.name ?? member.user.email}
          </span>
          <span className="text-muted-foreground">({member.role})</span>
        </>
      )}
      successDescription={(data) =>
        `Successfully removed ${data?.removedCount ?? memberCount} member(s)`
      }
      successTitle="Members removed"
      title="Remove Members"
      triggerIcon={Trash2}
      triggerLabel="Remove"
    />
  );
}
