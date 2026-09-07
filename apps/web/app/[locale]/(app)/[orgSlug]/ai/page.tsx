import { SetBreadcrumbs } from "@repo/design-system/components/layout/breadcrumb-context";
import { ContentSection } from "@repo/design-system/components/layout/content-section";
import { getAiQuotaStatus, listConversations } from "@/lib/ai/queries";
import { getActiveOrganization } from "@/lib/organization/queries";
import { orgRoutes } from "@/lib/routes";
import { ConversationList } from "./components/conversation-list";
import { NewConversationButton } from "./components/new-conversation-button";
import { UsageMeter } from "./components/usage-meter";

interface AiPageProps {
  params: Promise<{ locale: string; orgSlug: string }>;
}

export default async function AiPage({ params }: AiPageProps) {
  const { orgSlug } = await params;
  const org = await getActiveOrganization(orgSlug);

  const [conversations, quota] = await Promise.all([
    listConversations(org.organizationId, org.userId),
    getAiQuotaStatus(org.organizationId),
  ]);

  return (
    <>
      <SetBreadcrumbs
        items={[
          { label: "Organization", href: orgRoutes.home(orgSlug) },
          { label: "AI Chat" },
        ]}
      />
      <ContentSection
        action={
          <NewConversationButton
            organizationId={org.organizationId}
            orgSlug={orgSlug}
          />
        }
        contentClassName="lg:max-w-3xl"
        description="Chat with an LLM or generate images. Usage counts against your plan's monthly limit."
        title="AI Chat"
      >
        <UsageMeter quota={quota} />
        <ConversationList
          conversations={conversations}
          organizationId={org.organizationId}
          orgSlug={orgSlug}
        />
      </ContentSection>
    </>
  );
}
