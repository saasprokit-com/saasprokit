"use server";

import { database } from "@repo/database";
import { createRequestLogger } from "@repo/logger/log";
import { generateId, generateImage, type UIMessage } from "ai";
import {
  recordAiUsage,
  saveMessages,
  storeGeneratedImage,
} from "@/lib/ai/actions";
import { IMAGE_MODEL, MOCK_IMAGE_MODEL } from "@/lib/ai/models";
import { getAiQuotaStatus, isWithinAiQuota } from "@/lib/ai/queries";
import { isConfigured, registry } from "@/lib/ai/registry";
import { verifySession } from "@/lib/auth/action-auth";
import { actionError, toActionError } from "@/lib/auth/action-error";
import type { ActionResult } from "@/lib/auth/auth";
import { env } from "@/lib/env";
import { revalidateOrgPage } from "@/lib/infrastructure/revalidation";
import { validateOrganizationMembership } from "@/lib/organization/queries";
import { ORG_PAGES } from "@/lib/routes";
import {
  type CreateConversationInput,
  createConversationSchema,
  type DeleteConversationInput,
  deleteConversationSchema,
  type GenerateImageInput,
  generateImageSchema,
} from "./schemas";

const IMAGE_SIZE = "1024x1024";

export async function createConversationAction(
  input: CreateConversationInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = createConversationSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("invalidInput");
  }
  const { organizationId, orgSlug } = parsed.data;

  try {
    const { session, error } = await verifySession<{ id: string }>();
    if (error) {
      return error;
    }
    const isMember = await validateOrganizationMembership(
      organizationId,
      session.user.id
    );
    if (!isMember) {
      return actionError("unauthorized");
    }

    const conversation = await database.aiConversation.create({
      data: { organizationId, userId: session.user.id },
      select: { id: true },
    });

    await revalidateOrgPage(orgSlug, ORG_PAGES.AI);
    return { success: true, data: { id: conversation.id } };
  } catch (error) {
    return toActionError(error, { fallback: "createConversation" });
  }
}

export async function deleteConversationAction(
  input: DeleteConversationInput,
  _prevState: ActionResult | null,
  _formData: FormData
): Promise<ActionResult> {
  const parsed = deleteConversationSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("invalidInput");
  }
  const { organizationId, orgSlug, conversationId } = parsed.data;

  try {
    const { session, error } = await verifySession();
    if (error) {
      return error;
    }

    const isMember = await validateOrganizationMembership(
      organizationId,
      session.user.id
    );
    if (!isMember) {
      return actionError("unauthorized");
    }

    const { count } = await database.aiConversation.deleteMany({
      where: { id: conversationId, organizationId, userId: session.user.id },
    });
    if (count === 0) {
      return actionError("notFound");
    }

    await revalidateOrgPage(orgSlug, ORG_PAGES.AI);
    return { success: true };
  } catch (error) {
    return toActionError(error, { fallback: "deleteConversation" });
  }
}

export async function generateImageAction(
  input: GenerateImageInput
): Promise<ActionResult<{ messages: UIMessage[] }>> {
  const parsed = generateImageSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("invalidInput");
  }
  const { organizationId, orgSlug, conversationId, prompt } = parsed.data;
  const logger = createRequestLogger({
    action: "generateImage",
    organizationId,
  });

  try {
    const { session, error } = await verifySession<{ messages: UIMessage[] }>();
    if (error) {
      return error;
    }
    const userId = session.user.id;

    const isMember = await validateOrganizationMembership(
      organizationId,
      userId
    );
    if (!isMember) {
      return actionError("unauthorized");
    }

    const conversation = await database.aiConversation.findFirst({
      where: { id: conversationId, organizationId, userId },
      select: { id: true },
    });
    if (!conversation) {
      return actionError("notFound");
    }

    const imageModelId = env.AI_MOCK === true ? MOCK_IMAGE_MODEL : IMAGE_MODEL;
    if (!isConfigured(imageModelId)) {
      return actionError("invalidInput");
    }

    const quota = await getAiQuotaStatus(organizationId);
    if (!isWithinAiQuota(quota, "image")) {
      return actionError("aiQuotaExceeded");
    }

    const { image } = await generateImage({
      model: registry.imageModel(imageModelId),
      prompt,
      size: IMAGE_SIZE,
    });
    const stored = await storeGeneratedImage({
      image,
      organizationId,
      uploadedById: userId,
      conversationId,
    });

    const messages: UIMessage[] = [
      {
        id: generateId(),
        role: "user",
        parts: [{ type: "text", text: prompt }],
      },
      {
        id: generateId(),
        role: "assistant",
        parts: [
          {
            type: "file",
            mediaType: stored.mediaType,
            url: stored.url,
            filename: stored.filename,
          },
        ],
      },
    ];

    await saveMessages(conversationId, messages);
    await recordAiUsage({
      organizationId,
      userId,
      modelId: imageModelId,
      imageCount: 1,
    });

    await revalidateOrgPage(orgSlug, ORG_PAGES.AI);
    return { success: true, data: { messages } };
  } catch (error) {
    return toActionError(error, { fallback: "generateImage", logger });
  }
}
