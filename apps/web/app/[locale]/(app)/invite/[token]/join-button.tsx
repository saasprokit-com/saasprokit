"use client";

import { Button } from "@repo/design-system/components/ui/button";
import type { ActionErrorMessages } from "@repo/internationalization";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { toast } from "sonner";
import { useActionResult } from "@/hooks/use-action-result";

import type { ActionResult } from "@/lib/auth/auth";
import { acceptInviteLinkFormAction } from "../actions";

interface JoinButtonProps {
  errors: ActionErrorMessages;
  token: string;
}

const initialState: ActionResult<{ organizationSlug: string }> = {
  success: false,
};

export function JoinButton({ token, errors }: JoinButtonProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    acceptInviteLinkFormAction,
    initialState
  );

  useActionResult(state, {
    onError: (error) => toast.error(error ?? errors.joinOrganization),
    onSuccess: (data) => {
      if (!data) {
        return;
      }
      toast.success("You've joined the organization!");
      router.push(`/${data.organizationSlug}`);
    },
  });

  return (
    <form action={formAction}>
      <input name="token" type="hidden" value={token} />
      <Button className="w-full" disabled={isPending} size="lg" type="submit">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Joining...
          </>
        ) : (
          "Join Organization"
        )}
      </Button>
    </form>
  );
}
