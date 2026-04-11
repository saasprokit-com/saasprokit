import "server-only";

import { database } from "@repo/database";
import type { createRequestLogger } from "@repo/logger/server";
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from "@repo/storage";
import { ATTACHABLE_TYPE } from "@repo/utils/storage";
import { NextResponse } from "next/server";
import { checkOrgPermission } from "@/lib/auth/auth";
import { validateStorageQuota } from "@/lib/files/storage-quota";

const BYTES_PER_KILOBYTE = 1024;
const BYTES_PER_MEGABYTE = BYTES_PER_KILOBYTE * BYTES_PER_KILOBYTE;

/**
 * Validate uploaded file for security and content requirements
 */
export async function validateUploadedFile(
  file: File,
  logger: ReturnType<typeof createRequestLogger>
): Promise<{
  valid: boolean;
  error?: string;
  status?: number;
  buffer?: Buffer;
}> {
  if (file.size > MAX_FILE_SIZE) {
    logger.warn(
      {
        fileSize: file.size,
        maxSize: MAX_FILE_SIZE,
        filename: file.name,
      },
      "File size exceeds limit"
    );
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / BYTES_PER_MEGABYTE}MB`,
      status: 400,
    };
  }

  if (
    !ALLOWED_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_TYPES)[number]
    )
  ) {
    logger.warn(
      {
        fileType: file.type,
        allowedTypes: ALLOWED_IMAGE_TYPES,
        filename: file.name,
      },
      "Invalid file type submitted"
    );
    return {
      valid: false,
      error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF",
      status: 400,
    };
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return { valid: true, buffer };
}

/**
 * Validate organization logo upload permissions
 */
async function validateOrgLogoPermissions(
  organizationId: string | null,
  userId: string,
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

  // CRITICAL: Validate organization exists before attempting file creation
  // This prevents orphaned file records if org is deleted between validation and upload
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

  // Check permission via BA permission system
  const caller = await checkOrgPermission(organizationId, {
    organization: ["update"],
  });
  if (!caller) {
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

  // Defense-in-depth: check suspension (BA permissions don't check suspendedAt)
  const suspended = await database.member.findFirst({
    where: { organizationId, userId, suspendedAt: { not: null } },
    select: { id: true },
  });
  if (suspended) {
    logger.warn({ organizationId }, "Suspended member attempted logo upload");
    return {
      valid: false,
      error: "You don't have permission to update this organization's logo",
      status: 403,
    };
  }

  return { valid: true, organizationId };
}

/**
 * Handle file type-specific setup (folder, attachable type/id)
 * Returns early if validation fails
 */
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
      userId2,
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
