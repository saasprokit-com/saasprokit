import "server-only";

import { database } from "@repo/database";
import type { createRequestLogger } from "@repo/logger/server";
import { imageFileSchema } from "@repo/storage";
import { ATTACHABLE_TYPE } from "@repo/utils/storage";
import { NextResponse } from "next/server";
import { hasOrgPermission } from "@/lib/auth/auth";
import { validateStorageQuota } from "@/lib/files/storage-quota";

export async function validateUploadedFile(
  file: File,
  logger: ReturnType<typeof createRequestLogger>
): Promise<{
  valid: boolean;
  error?: string;
  status?: number;
  buffer?: Buffer;
}> {
  const validation = imageFileSchema.safeParse(file);
  if (!validation.success) {
    const issue = validation.error.issues[0];
    logger.warn(
      {
        filename: file.name,
        fileSize: file.size,
        fileType: file.type,
        rule: issue?.path[0] ?? "file",
      },
      "Uploaded file failed validation"
    );
    return {
      valid: false,
      error: issue?.message ?? "Invalid file",
      status: 400,
    };
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return { valid: true, buffer };
}

async function validateOrgLogoPermissions(
  organizationId: string | null,
  logger: ReturnType<typeof createRequestLogger>
) {
  if (!organizationId) {
    logger.warn({}, "Org logo upload missing organization ID");
    return {
      valid: false,
      error: "Organization ID required for logo upload",
      status: 400,
    };
  }

  const organization = await database.organization.findUnique({
    where: { id: organizationId },
    select: { id: true },
  });

  if (!organization) {
    logger.warn(
      {
        organizationId,
      },
      "Organization not found for logo upload"
    );
    return {
      valid: false,
      error: "Organization not found",
      status: 404,
    };
  }

  const allowed = await hasOrgPermission(organizationId, {
    organization: ["update"],
  });
  if (!allowed) {
    logger.warn(
      {
        organizationId,
      },
      "Insufficient permissions for org logo upload"
    );
    return {
      valid: false,
      error: "You don't have permission to update this organization's logo",
      status: 403,
    };
  }

  return { valid: true, organizationId };
}

export async function setupFileType(options: {
  type: string | null;
  file: File;
  organizationId: string | null;
  userId: string;
  userLogger: ReturnType<typeof createRequestLogger>;
}): Promise<
  | {
      success: false;
      response: Response;
    }
  | {
      success: true;
      folder: string;
      attachableType: string | undefined;
      attachableId: string | undefined;
    }
> {
  const {
    type: fileType,
    file,
    organizationId,
    userId: userId2,
    userLogger,
  } = options;

  let folder = "uploads";
  let attachableType: string | undefined;
  let attachableId: string | undefined;

  if (fileType === "avatar") {
    folder = "avatars";
    attachableType = ATTACHABLE_TYPE.USER;
    attachableId = userId2;
  } else if (fileType === "org-logo") {
    const validation = await validateOrgLogoPermissions(
      organizationId,
      userLogger
    );

    if (!validation.valid) {
      return {
        success: false,
        response: NextResponse.json(
          { error: validation.error },
          { status: validation.status }
        ),
      };
    }

    folder = "logos";
    attachableType = ATTACHABLE_TYPE.ORGANIZATION;
    attachableId = validation.organizationId;

    if (!attachableId) {
      userLogger.warn(
        {},
        "Organization ID missing after permission validation"
      );
      return {
        success: false,
        response: NextResponse.json(
          { error: "Organization ID missing" },
          { status: 400 }
        ),
      };
    }

    // CRITICAL: Validate organization storage quota before upload
    // Prevents users from exceeding their storage limits
    const storageQuotaCheck = await validateStorageQuota(
      attachableId,
      file.size,
      userLogger
    );

    if (!storageQuotaCheck.valid) {
      return {
        success: false,
        response: NextResponse.json(
          { error: storageQuotaCheck.error },
          { status: storageQuotaCheck.status }
        ),
      };
    }
  }

  return { success: true, folder, attachableType, attachableId };
}
