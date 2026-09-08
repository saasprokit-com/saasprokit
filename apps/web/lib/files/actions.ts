import "server-only";

import { database } from "@repo/database";
import type { createRequestLogger } from "@repo/logger/log";
import { deleteFile, uploadFile } from "@repo/storage/server";
import { ATTACHABLE_TYPE } from "@repo/utils/storage";

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
          logger.warn("Stored object not deleted", {
            storagePath: file.storagePath,
            err: error,
          })
      )
    )
  );
}

export async function storeOrganizationLogo(options: {
  file: File;
  organizationId: string;
  uploadedById: string;
  logger: ReturnType<typeof createRequestLogger>;
}): Promise<{ publicUrl: string | null; slug: string }> {
  const { file, organizationId, uploadedById, logger } = options;

  const uploadResult = await uploadFile({
    filename: file.name,
    buffer: Buffer.from(await file.arrayBuffer()),
    mimeType: file.type,
    folder: "logos",
    uploadedById,
    attachableType: ATTACHABLE_TYPE.ORGANIZATION,
    attachableId: organizationId,
  });

  const fileRecord = await database.file.create({
    data: {
      filename: uploadResult.filename,
      storagePath: uploadResult.storagePath,
      publicUrl: uploadResult.publicUrl,
      mimeType: uploadResult.mimeType,
      size: uploadResult.size,
      provider: uploadResult.provider,
      bucket: uploadResult.bucket,
      visibility: uploadResult.visibility,
      attachableType: ATTACHABLE_TYPE.ORGANIZATION,
      attachableId: organizationId,
      uploadedById,
    },
    select: { id: true },
  });

  const siblings = {
    attachableType: ATTACHABLE_TYPE.ORGANIZATION,
    attachableId: organizationId,
    id: { not: fileRecord.id },
    deletedAt: null,
  };

  const [organization, replaced] = await database.$transaction([
    database.organization.update({
      where: { id: organizationId },
      data: { logo: uploadResult.publicUrl },
      select: { slug: true },
    }),
    database.file.findMany({
      where: siblings,
      select: { storagePath: true, bucket: true },
    }),
    database.file.updateMany({
      where: siblings,
      data: { deletedAt: new Date() },
    }),
  ]);

  await deleteStoredObjects(replaced, logger);

  return { publicUrl: uploadResult.publicUrl, slug: organization.slug };
}
