import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { createRequestLogger } from "@repo/logger/server";
import { imageFileSchema, uploadTypeSchema } from "@repo/storage/constants";
import { uploadFile } from "@repo/storage/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { handlePostUploadOperations } from "@/lib/files/actions";
import { setupFileType } from "@/lib/files/queries";

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
    const organizationIdEntry = formData.get("organizationId");
    const organizationId =
      typeof organizationIdEntry === "string" ? organizationIdEntry : null;

    const parsedFile = imageFileSchema.safeParse(formData.get("file"));
    if (!parsedFile.success) {
      const issue = parsedFile.error.issues[0];
      userLogger.warn(
        { rule: issue?.path[0] ?? "file" },
        "Uploaded file failed validation"
      );
      return NextResponse.json(
        { error: issue?.message ?? "Invalid file" },
        { status: 400 }
      );
    }
    const file = parsedFile.data;

    const parsedType = uploadTypeSchema.safeParse(formData.get("type"));
    if (!parsedType.success) {
      userLogger.warn({}, "Upload request has an unsupported type");
      return NextResponse.json(
        { error: "Unsupported upload type" },
        { status: 400 }
      );
    }
    const type = parsedType.data;

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
      buffer: Buffer.from(await file.arrayBuffer()),
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

    await handlePostUploadOperations({
      type,
      fileRecord,
      uploadResult,
      attachableType,
      attachableId,
      logger: userLogger,
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
