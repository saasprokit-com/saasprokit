import "server-only";

import { database } from "@repo/database";
import { ATTACHABLE_TYPE } from "@repo/utils/storage";

/**
 * Handle post-upload file operations (set as avatar/logo, delete old files)
 */
export async function handlePostUploadOperations(options: {
  type: string | null;
  fileRecord: { id: string };
  uploadResult: { publicUrl: string | null };
  userId: string;
  organizationId: string | null;
}): Promise<void> {
  const { type, fileRecord, uploadResult, userId, organizationId } = options;

  // CRITICAL: Wrap all post-upload operations in a transaction
  // Ensures either both user/org update AND old file soft-delete happen, or neither
  // Prevents data inconsistency if one operation fails
  if (type === "avatar") {
    await database.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { image: uploadResult.publicUrl },
      });

      await tx.file.updateMany({
        where: {
          attachableType: ATTACHABLE_TYPE.USER,
          attachableId: userId,
          id: { not: fileRecord.id },
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });
    });
  }

  if (type === "org-logo" && organizationId) {
    await database.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id: organizationId },
        data: { logo: uploadResult.publicUrl },
      });

      await tx.file.updateMany({
        where: {
          attachableType: ATTACHABLE_TYPE.ORGANIZATION,
          attachableId: organizationId,
          id: { not: fileRecord.id },
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });
    });
  }
}
