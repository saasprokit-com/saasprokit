import "server-only";

import { database } from "@repo/database";
import type { createRequestLogger } from "@repo/logger/server";
import type { UploadType } from "@repo/storage/constants";
import { deleteFile, uploadFile } from "@repo/storage/server";
import { ATTACHABLE_TYPE, type AttachableType } from "@repo/utils/storage";

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

  const { replaced, slug } = await database.$transaction(async (tx) => {
    const organization = await tx.organization.update({
      where: { id: organizationId },
      data: { logo: uploadResult.publicUrl },
      select: { slug: true },
    });
    const rows = await tx.file.findMany({
      where: siblings,
      select: { storagePath: true, bucket: true },
    });
    await tx.file.updateMany({
      where: siblings,
      data: { deletedAt: new Date() },
    });
    return { replaced: rows, slug: organization.slug };
  });

  await deleteStoredObjects(replaced, logger);

  return { publicUrl: uploadResult.publicUrl, slug };
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
