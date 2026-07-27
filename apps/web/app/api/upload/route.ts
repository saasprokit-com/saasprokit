import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { createRequestLogger } from "@repo/logger/server";
import { deleteFile, uploadFile } from "@repo/storage";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { handlePostUploadOperations } from "@/lib/files/actions";
import { setupFileType, validateUploadedFile } from "@/lib/files/queries";

export async function POST(request: Request) {
  const logger = createRequestLogger({
    endpoint: "/api/upload",
    method: "POST",
  });

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      logger.warn("Unauthorized upload attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userLogger = logger.child({ userId: session.user.id });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;
    const organizationId = formData.get("organizationId") as string | null;

    if (!file) {
      userLogger.warn({}, "Upload request missing file");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file security and content requirements
    const fileValidation = await validateUploadedFile(file, userLogger);
    if (!fileValidation.valid) {
      return NextResponse.json(
        { error: fileValidation.error },
        { status: fileValidation.status }
      );
    }

    // Setup file type-specific parameters and validate permissions
    const typeSetup = await setupFileType({
      type,
      file,
      organizationId,
      userId: session.user.id,
      userLogger,
    });

    if (!typeSetup.success) {
      return typeSetup.response;
    }

    const { folder, attachableType, attachableId } = typeSetup;

    const uploadResult = await uploadFile({
      filename: file.name,
      buffer: fileValidation.buffer!,
      mimeType: file.type,
      folder,
      uploadedById: session.user.id,
      attachableType,
      attachableId,
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
        attachableType,
        attachableId,
        uploadedById: session.user.id,
      },
    });

    // Handle post-upload operations (set as avatar/logo, delete old files)
    await handlePostUploadOperations({
      type,
      fileRecord,
      uploadResult,
      userId: session.user.id,
      organizationId,
    });

    userLogger.info(
      {
        filename: uploadResult.filename,
        size: uploadResult.size,
        type,
        storagePath: uploadResult.storagePath,
      },
      "File uploaded successfully"
    );

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        storagePath: uploadResult.storagePath,
        publicUrl: uploadResult.publicUrl,
        filename: uploadResult.filename,
        mimeType: uploadResult.mimeType,
        size: uploadResult.size,
        provider: uploadResult.provider,
      },
    });
  } catch (error) {
    logger.error(
      {
        err: error instanceof Error ? error : new Error(String(error)),
      },
      "File upload failed"
    );
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const logger = createRequestLogger({
    endpoint: "/api/upload",
    method: "DELETE",
  });

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      logger.warn("Unauthorized file deletion attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userLogger = logger.child({ userId: session.user.id });

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("id");

    if (!fileId) {
      userLogger.warn({}, "File deletion missing file ID");
      return NextResponse.json({ error: "File ID required" }, { status: 400 });
    }

    const file = await database.file.findFirst({
      where: {
        id: fileId,
        uploadedById: session.user.id,
        deletedAt: null,
      },
    });

    if (!file) {
      userLogger.warn({ fileId }, "File not found or unauthorized");
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    try {
      await deleteFile(file.storagePath, file.bucket ?? undefined);
      userLogger.info(
        {
          storagePath: file.storagePath,
        },
        "File deleted from storage"
      );
    } catch (deleteError) {
      userLogger.warn(
        {
          storagePath: file.storagePath,
          err:
            deleteError instanceof Error
              ? deleteError
              : new Error(String(deleteError)),
        },
        "Failed to delete file from storage"
      );
    }

    await database.file.update({
      where: { id: fileId },
      data: { deletedAt: new Date() },
    });

    userLogger.info({ fileId }, "File soft-deleted successfully");

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      {
        err: error instanceof Error ? error : new Error(String(error)),
      },
      "File deletion failed"
    );
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
