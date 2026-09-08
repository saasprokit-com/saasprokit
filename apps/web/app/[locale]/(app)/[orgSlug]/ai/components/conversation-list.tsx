import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import { formatDate } from "@repo/design-system/lib/date";
import Link from "next/link";
import type { ConversationListItem } from "@/lib/ai/queries";
import { orgRoutes } from "@/lib/routes";
import { DeleteConversationButton } from "./delete-conversation-button";

interface ConversationListProps {
  conversations: ConversationListItem[];
  organizationId: string;
  orgSlug: string;
}

export function ConversationList({
  conversations,
  organizationId,
  orgSlug,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No conversations yet</EmptyTitle>
          <EmptyDescription>
            Start one to chat or generate an image.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {conversations.map((conversation) => (
        <li
          className="flex items-center justify-between gap-4 px-4 py-3"
          key={conversation.id}
        >
          <Link
            className="min-w-0 flex-1 hover:underline"
            href={orgRoutes.aiConversation(orgSlug, conversation.id)}
          >
            <p className="truncate font-medium">
              {conversation.title ?? "Untitled conversation"}
            </p>
            <p className="text-muted-foreground text-xs">
              {formatDate(conversation.updatedAt)}
            </p>
          </Link>
          <DeleteConversationButton
            conversationId={conversation.id}
            organizationId={organizationId}
            orgSlug={orgSlug}
          />
        </li>
      ))}
    </ul>
  );
}
