"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { orgRoutes } from "@/lib/routes";
import { createConversationAction } from "../actions";

interface NewConversationButtonProps {
  organizationId: string;
  orgSlug: string;
}

export function NewConversationButton({
  organizationId,
  orgSlug,
}: NewConversationButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await createConversationAction({
        organizationId,
        orgSlug,
      });
      startTransition(() => {
        if (result.success && result.data) {
          router.push(orgRoutes.aiConversation(orgSlug, result.data.id));
        }
      });
      if (!result.success) {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  }

  return (
    <Button disabled={isPending} onClick={onClick}>
      <Plus className="mr-2 size-4" />
      New conversation
    </Button>
  );
}
