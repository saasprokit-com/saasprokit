"use client";

import { Button } from "@repo/design-system/components/ui/button";
import type { ActionErrorMessages } from "@repo/internationalization";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/auth/auth";
import { acceptInvitationFormAction } from "../actions";

interface AcceptInvitationButtonProps {
  invitationId: string;
  errors: ActionErrorMessages;
}

const initialState: ActionResult<{ organizationSlug: string }> = {
  success: false,
};

export function AcceptInvitationButton({
  invitationId,
  errors,
}: AcceptInvitationButtonProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    acceptInvitationFormAction,
    initialState
  );

  useEffect(() => {
    if (state === initialState) {
      return;
    }

    if (state.success && state.data) {
      toast.success("You've joined the organization!");
      router.push(`/${state.data.organizationSlug}`);
    } else if (!state.success && state.error) {
      toast.error(state.error || errors.acceptInvitation);
    }
  }, [state, router, errors]);

  return (
    <form action={formAction}>
      <input name="invitationId" type="hidden" value={invitationId} />
      <Button className="w-full" disabled={isPending} size="lg" type="submit">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Joining...
          </>
        ) : (
          "Accept Invitation"
        )}
      </Button>
    </form>
  );
}
