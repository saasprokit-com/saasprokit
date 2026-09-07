"use client";

import type { ActionErrorMessages } from "@repo/internationalization";
import { XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { BulkConfirmDialog } from "../../components/bulk-confirm-dialog";
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
  const count = selectedLinks.length;

  return (
    <BulkConfirmDialog<InviteLink, { revokedCount: number }>
      action={revokeInviteLinksAction.bind(null, {
        organizationId,
        orgSlug,
        inviteLinkIds: selectedLinks.map((link) => link.id),
      })}
      cancelLabel="Close"
      confirmLabel="Revoke Links"
      description={`Are you sure you want to revoke ${count} invite link${count > 1 ? "s" : ""}? Anyone with these links will no longer be able to join your organization.`}
      errorTitle={errors.revokeInviteLinks}
      fullWidthConfirm
      items={selectedLinks}
      onSuccess={onSuccess}
      pendingLabel="Revoking..."
      renderItem={(link) => (
        <>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            /invite/{link.token.slice(0, TOKEN_PREVIEW_LENGTH)}...
          </code>
          <span className="text-muted-foreground capitalize">
            ({link.role})
          </span>
        </>
      )}
      successDescription={(data) =>
        `Successfully revoked ${data?.revokedCount ?? 0} invite link(s)`
      }
      successTitle="Invite links revoked"
      title="Revoke Invite Links"
      triggerIcon={XCircle}
      triggerLabel="Revoke"
    />
  );
}
