import { SetBreadcrumbs } from "@repo/design-system/components/layout/breadcrumb-context";
import { notFound } from "next/navigation";
import { IMAGE_MODEL } from "@/lib/ai/models";
import {
  getAiQuotaStatus,
  getOwnedConversation,
  titleOf,
} from "@/lib/ai/queries";
import { availableChatModels, isConfigured } from "@/lib/ai/registry";
import { getActiveOrganization } from "@/lib/organization/queries";
import { orgRoutes } from "@/lib/routes";
import { ChatThread } from "../components/chat-thread";

interface ConversationPageProps {
  params: Promise<{ locale: string; orgSlug: string; conversationId: string }>;
}

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { orgSlug, conversationId } = await params;
  const org = await getActiveOrganization(orgSlug);

  const [conversation, quota] = await Promise.all([
    getOwnedConversation(conversationId, org.userId),
    getAiQuotaStatus(org.organizationId),
  ]);
  if (!conversation || conversation.organizationId !== org.organizationId) {
    notFound();
  }

  return (
    <>
      <SetBreadcrumbs
        items={[
          { label: "Organization", href: orgRoutes.home(orgSlug) },
          { label: "AI Chat", href: orgRoutes.ai(orgSlug) },
          { label: titleOf(conversation.messages) ?? "New conversation" },
        ]}
      />
      <ChatThread
        canGenerateImages={isConfigured(IMAGE_MODEL)}
        chatModels={availableChatModels()}
        conversationId={conversation.id}
        initialMessages={conversation.messages}
        organizationId={org.organizationId}
        orgSlug={orgSlug}
        quota={quota}
      />
    </>
  );
}
