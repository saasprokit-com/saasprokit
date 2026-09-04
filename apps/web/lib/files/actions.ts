import "server-only";

import { database } from "@repo/database";
import type { UploadType } from "@repo/storage/constants";
import type { AttachableType } from "@repo/utils/storage";

export async function handlePostUploadOperations(options: {
  type: UploadType;
  fileRecord: { id: string };
  uploadResult: { publicUrl: string | null };
  attachableType: AttachableType;
  attachableId: string;
}): Promise<void> {
  const { type, fileRecord, uploadResult, attachableType, attachableId } =
    options;

  await database.$transaction(async (tx) => {
    if (type === "avatar") {
      await tx.user.update({
        where: { id: attachableId },
        data: { image: uploadResult.publicUrl },
      });
    }

    if (type === "org-logo") {
      await tx.organization.update({
        where: { id: attachableId },
        data: { logo: uploadResult.publicUrl },
      });
    }

    await tx.file.updateMany({
      where: {
        attachableType,
        attachableId,
        id: { not: fileRecord.id },
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });
  });
}
