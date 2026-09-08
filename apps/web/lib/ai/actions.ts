import "server-only";

import { database } from "@repo/database";
import { uploadFile } from "@repo/storage/server";
import { ATTACHABLE_TYPE } from "@repo/utils/storage";
import type { GeneratedFile, UIMessage } from "ai";

export interface RecordAiUsageInput {
  imageCount?: number;
  modelId: string;
  organizationId: string;
  totalTokens?: number;
  userId: string;
}

export async function recordAiUsage(input: RecordAiUsageInput): Promise<void> {
  await database.aiUsage.create({ data: input });
}

export async function saveMessages(
  conversationId: string,
  messages: UIMessage[]
): Promise<void> {
  await database.$transaction([
    database.aiMessage.createMany({
      data: messages.map((message) => ({
        id: message.id,
        conversationId,
        role: message.role,
        parts: JSON.stringify(message.parts),
      })),
      skipDuplicates: true,
    }),
    database.aiConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);
}

export interface StoredGeneratedImage {
  filename: string;
  mediaType: string;
  url: string;
}

export async function storeGeneratedImage(options: {
  image: GeneratedFile;
  organizationId: string;
  uploadedById: string;
  conversationId: string;
}): Promise<StoredGeneratedImage> {
  const { image, organizationId, uploadedById, conversationId } = options;
  const { publicUrl, mimeType, filename } = await uploadFile({
    filename: conversationId,
    buffer: Buffer.from(image.uint8Array),
    mimeType: image.mediaType,
    folder: "ai-images",
    uploadedById,
    attachableType: ATTACHABLE_TYPE.ORGANIZATION,
    attachableId: organizationId,
  });
  if (!publicUrl) {
    throw new Error("Generated image has no public URL");
  }
  return { url: publicUrl, mediaType: mimeType, filename };
}
