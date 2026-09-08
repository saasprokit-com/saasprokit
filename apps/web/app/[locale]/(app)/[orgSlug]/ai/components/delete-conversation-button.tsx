"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Trash2 } from "lucide-react";
import { useActionState } from "react";
import { toast } from "sonner";
import { useActionResult } from "@/hooks/use-action-result";
import { deleteConversationAction } from "../actions";

interface DeleteConversationButtonProps {
  conversationId: string;
  organizationId: string;
  orgSlug: string;
}

export function DeleteConversationButton({
  conversationId,
  organizationId,
  orgSlug,
}: DeleteConversationButtonProps) {
  const boundAction = deleteConversationAction.bind(null, {
    conversationId,
    organizationId,
    orgSlug,
  });
  const [state, formAction, isPending] = useActionState(boundAction, null);

  useActionResult(state, {
    onSuccess: () => toast.success("Conversation deleted"),
    onError: (error) => toast.error(error ?? "Something went wrong"),
  });

  return (
    <form action={formAction}>
      <Button
        aria-label="Delete conversation"
        disabled={isPending}
        size="icon"
        type="submit"
        variant="ghost"
      >
        <Trash2 className="size-4" />
      </Button>
    </form>
  );
}
