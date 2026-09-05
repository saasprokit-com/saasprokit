import "server-only";

import type { createRequestLogger } from "@repo/logger/server";
import type { UploadType } from "@repo/storage/constants";
import { ATTACHABLE_TYPE, type AttachableType } from "@repo/utils/storage";
import { NextResponse } from "next/server";
import { hasOrgPermission } from "@/lib/auth/auth";
import { validateStorageQuota } from "@/lib/files/storage-quota";

type UploadTypeConfig =
  | { attachableType: typeof ATTACHABLE_TYPE.USER; folder: string }
  | {
      attachableType: typeof ATTACHABLE_TYPE.ORGANIZATION;
      folder: string;
      quota: boolean;
    };

const UPLOAD_TYPES = {
  avatar: {
    attachableType: ATTACHABLE_TYPE.USER,
    folder: "avatars",
  },
  "org-logo": {
    attachableType: ATTACHABLE_TYPE.ORGANIZATION,
    folder: "logos",
    quota: true,
  },
} as const satisfies Record<UploadType, UploadTypeConfig>;

type OrgUploadPermission =
  | { valid: false; error: string; status: number }
  | { valid: true; organizationId: string };

async function validateOrgUploadPermission(
  organizationId: string | null,
  logger: ReturnType<typeof createRequestLogger>
): Promise<OrgUploadPermission> {
  if (!organizationId) {
    logger.warn({}, "Organization upload missing organization ID");
    return {
      valid: false,
      error: "Organization ID required for this upload",
      status: 400,
    };
  }

  const allowed = await hasOrgPermission(organizationId, {
    organization: ["update"],
  });
  if (!allowed) {
    logger.warn({ organizationId }, "Insufficient permissions for org upload");
    return {
      valid: false,
      error: "You don't have permission to update this organization",
      status: 403,
    };
  }

  return { valid: true, organizationId };
}

type SetupFileTypeResult =
  | { success: false; response: Response }
  | {
      success: true;
      folder: string;
      attachableType: AttachableType;
      attachableId: string;
    };

export async function setupFileType(options: {
  type: UploadType;
  file: File;
  organizationId: string | null;
  userId: string;
  userLogger: ReturnType<typeof createRequestLogger>;
}): Promise<SetupFileTypeResult> {
  const { type, file, organizationId, userId, userLogger } = options;
  const config = UPLOAD_TYPES[type];

  if (config.attachableType === ATTACHABLE_TYPE.USER) {
    return {
      success: true,
      folder: config.folder,
      attachableType: config.attachableType,
      attachableId: userId,
    };
  }

  const permission = await validateOrgUploadPermission(
    organizationId,
    userLogger
  );

  if (!permission.valid) {
    return {
      success: false,
      response: NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      ),
    };
  }

  if (config.quota) {
    const quotaCheck = await validateStorageQuota(
      permission.organizationId,
      file.size,
      userLogger
    );

    if (!quotaCheck.valid) {
      return {
        success: false,
        response: NextResponse.json(
          { error: quotaCheck.error },
          { status: quotaCheck.status }
        ),
      };
    }
  }

  return {
    success: true,
    folder: config.folder,
    attachableType: config.attachableType,
    attachableId: permission.organizationId,
  };
}
