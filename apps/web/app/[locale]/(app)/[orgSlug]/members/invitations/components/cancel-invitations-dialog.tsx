"use client";

import { ORG_ROLES } from "@repo/auth/permissions";
import type { ActionErrorMessages } from "@repo/internationalization";
import { XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { BulkConfirmDialog } from "../../components/bulk-confirm-dialog";
import {
  type CancelInvitationsResult,
  cancelInvitationsAction,
} from "../actions";
import type { Invitation } from "../queries";

interface CancelInvitationsDialogProps {
  errors: ActionErrorMessages;
  onSuccess: () => void;
  organizationId: string;
  selectedInvitations: Invitation[];
}

export function CancelInvitationsDialog({
  errors,
  organizationId,
  selectedInvitations,
  onSuccess,
}: CancelInvitationsDialogProps) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const count = selectedInvitations.length;

  return (
    <BulkConfirmDialog<Invitation, CancelInvitationsResult>
      action={cancelInvitationsAction.bind(null, {
        organizationId,
        orgSlug,
        invitationIds: selectedInvitations.map((inv) => inv.id),
      })}
      cancelLabel="Close"
      confirmLabel="Cancel Invitations"
      description={`Are you sure you want to cancel ${count} invitation${count > 1 ? "s" : ""}? The invited users will no longer be able to join with these invitations.`}
      errorTitle={errors.cancelInvitations}
      fullWidthConfirm
      items={selectedInvitations}
      onSuccess={onSuccess}
      pendingLabel="Cancelling..."
      renderItem={(invitation) => (
        <>
          <span className="font-medium">{invitation.email}</span>
          <span className="text-muted-foreground capitalize">
            ({invitation.role ?? ORG_ROLES.MEMBER})
          </span>
        </>
      )}
      successDescription={(data) =>
        `Successfully cancelled ${data?.cancelledCount ?? 0} invitation(s)`
      }
      successTitle="Invitations cancelled"
      title="Cancel Invitations"
      triggerIcon={XCircle}
      triggerLabel="Cancel"
    />
  );
}
