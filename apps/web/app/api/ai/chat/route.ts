import { createRequestLogger } from "@repo/logger/log";
import {
  convertToModelMessages,
  createIdGenerator,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { recordAiUsage, saveMessages } from "@/lib/ai/actions";
import { chatRequestSchema } from "@/lib/ai/models";
import {
  getAiQuotaStatus,
  getOwnedConversation,
  isWithinAiQuota,
} from "@/lib/ai/queries";
import { isConfigured, registry } from "@/lib/ai/registry";
import { getServerSession } from "@/lib/auth/auth";
import { validateOrganizationMembership } from "@/lib/organization/queries";
import { API_ROUTES } from "@/lib/routes";

const MAX_HISTORY_MESSAGES = 40;
const INSTRUCTIONS =
  "You are a helpful assistant inside a team workspace. Answer concisely and use Markdown only when it aids readability.";

const generateMessageId = createIdGenerator({ prefix: "msg", size: 16 });

function textOnly(messages: UIMessage[]): UIMessage[] {
  return messages
    .map((message) => ({
      ...message,
      parts: message.parts.filter((part) => part.type === "text"),
    }))
    .filter((message) => message.parts.length > 0);
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return new NextResponse(null, { status: 401 });
  }

  const parsed = chatRequestSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { id, message, modelId } = parsed.data;
  const userId = session.user.id;
  const logger = createRequestLogger({
    endpoint: API_ROUTES.AI_CHAT,
    method: "POST",
    userId,
  });
  const conversation = await getOwnedConversation(id, userId);
  if (!conversation) {
    return new NextResponse(null, { status: 404 });
  }

  const isMember = await validateOrganizationMembership(
    conversation.organizationId,
    userId
  );
  if (!isMember) {
    return new NextResponse(null, { status: 403 });
  }

  if (!isConfigured(modelId)) {
    return NextResponse.json({ error: "Model not available" }, { status: 400 });
  }

  const quota = await getAiQuotaStatus(conversation.organizationId);
  if (!isWithinAiQuota(quota, "chat")) {
    return NextResponse.json(
      { error: "Monthly AI token limit reached" },
      { status: 429 }
    );
  }

  await saveMessages(id, [message]);

  const history = [...conversation.messages, message];
  const result = streamText({
    model: registry.languageModel(
      modelId as Parameters<typeof registry.languageModel>[0]
    ),
    instructions: INSTRUCTIONS,
    messages: await convertToModelMessages(
      textOnly(history).slice(-MAX_HISTORY_MESSAGES)
    ),
    providerOptions: { anthropic: { thinking: { type: "adaptive" } } },
    onEnd: async ({ totalUsage }) => {
      await recordAiUsage({
        organizationId: conversation.organizationId,
        userId,
        modelId,
        totalTokens: totalUsage.totalTokens,
      });
    },
    onError: ({ error }) => {
      logger.error("Chat stream failed", {
        err: error,
        conversationId: id,
        modelId,
      });
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: history,
      generateMessageId,
      onEnd: async ({ responseMessage }) => {
        await saveMessages(id, [responseMessage]);
      },
    }),
  });
}
