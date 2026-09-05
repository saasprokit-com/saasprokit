import "server-only";

import { database } from "@repo/database";
import type { createRequestLogger } from "@repo/logger/server";
import type { UploadType } from "@repo/storage/constants";
import { deleteFile } from "@repo/storage/server";
import type { AttachableType } from "@repo/utils/storage";

interface StoredObject {
  bucket: string | null;
  storagePath: string;
}

export async function deleteStoredObjects(
  files: StoredObject[],
  logger: ReturnType<typeof createRequestLogger>
): Promise<void> {
  await Promise.all(
    files.map((file) =>
      deleteFile(file.storagePath, file.bucket ?? undefined).catch(
        (error: unknown) =>
          logger.warn(
            { storagePath: file.storagePath, err: error },
            "Stored object not deleted"
          )
      )
    )
  );
}

export async function handlePostUploadOperations(options: {
  type: UploadType;
  fileRecord: { id: string };
  uploadResult: { publicUrl: string | null };
  attachableType: AttachableType;
  attachableId: string;
  logger: ReturnType<typeof createRequestLogger>;
}): Promise<void> {
  const {
    type,
    fileRecord,
    uploadResult,
    attachableType,
    attachableId,
    logger,
  } = options;

  const replaced = await database.$transaction(async (tx) => {
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

    const siblings = {
      attachableType,
      attachableId,
      id: { not: fileRecord.id },
      deletedAt: null,
    };
    const rows = await tx.file.findMany({
      where: siblings,
      select: { storagePath: true, bucket: true },
    });
    await tx.file.updateMany({
      where: siblings,
      data: { deletedAt: new Date() },
    });
    return rows;
  });

  await deleteStoredObjects(replaced, logger);
}
