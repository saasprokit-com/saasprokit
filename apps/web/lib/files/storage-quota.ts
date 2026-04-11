import "server-only";

/**
 * Storage quota management and validation
 * Enforces per-organization storage limits based on subscription plan
 */

import type { createRequestLogger } from "@repo/logger/server";
import { getPlanLimits } from "@repo/payment/plans";
import {
  getCurrentPlanForReference,
  getOrgStorageUsage,
} from "@/lib/billing/subscription-queries";

const KILOBYTES_PER_MEGABYTE = 1024;
const BYTES_PER_KILOBYTE = 1024;
const BYTES_PER_MEGABYTE = KILOBYTES_PER_MEGABYTE * BYTES_PER_KILOBYTE;

async function getOrganizationStorageUsageBytes(
  organizationId: string
): Promise<number> {
  const usageMB = await getOrgStorageUsage(organizationId);
  return usageMB * BYTES_PER_MEGABYTE;
}

async function getOrganizationStorageQuota(
  organizationId: string
): Promise<number> {
  const planName = await getCurrentPlanForReference(organizationId);
  const limits = getPlanLimits(planName);
  if (limits.maxStorageMB === -1) {
    return -1;
  }
  return limits.maxStorageMB * BYTES_PER_MEGABYTE;
}

async function checkStorageQuota(
  organizationId: string,
  fileSizeBytes: number
): Promise<{
  allowed: boolean;
  usage: number;
  quota: number;
  available: number;
  percentageUsed: number;
}> {
  const [usage, quota] = await Promise.all([
    getOrganizationStorageUsageBytes(organizationId),
    getOrganizationStorageQuota(organizationId),
  ]);

  if (quota === -1) {
    return {
      allowed: true,
      usage,
      quota: -1,
      available: -1,
      percentageUsed: 0,
    };
  }

  const newTotal = usage + fileSizeBytes;
  const allowed = newTotal <= quota;
  const available = quota - usage;
  const PERCENTAGE_MULTIPLIER = 100;
  const percentageUsed = Math.round((usage / quota) * PERCENTAGE_MULTIPLIER);

  return { allowed, usage, quota, available, percentageUsed };
}

/**
 * Validate that a file upload won't exceed storage quota.
 * Use this before accepting file uploads to prevent quota exhaustion.
 */
export async function validateStorageQuota(
  organizationId: string,
  fileSizeBytes: number,
  logger: ReturnType<typeof createRequestLogger>
): Promise<{
  valid: boolean;
  error?: string;
  status?: number;
}> {
  try {
    const quotaCheck = await checkStorageQuota(organizationId, fileSizeBytes);

    if (!quotaCheck.allowed) {
      const quotaMB = quotaCheck.quota / BYTES_PER_MEGABYTE;
      const usageMB = quotaCheck.usage / BYTES_PER_MEGABYTE;
      const fileMB = fileSizeBytes / BYTES_PER_MEGABYTE;

      logger.warn(
        {
          organizationId,
          fileSize: fileSizeBytes,
          fileSizeMB: fileMB.toFixed(2),
          currentUsage: quotaCheck.usage,
          usageMB: usageMB.toFixed(2),
          quota: quotaCheck.quota,
          quotaMB: quotaMB.toFixed(2),
          percentageUsed: quotaCheck.percentageUsed,
        },
        "Storage quota exceeded"
      );

      return {
        valid: false,
        error: `Storage quota exceeded. You have used ${usageMB.toFixed(1)} MB of ${quotaMB.toFixed(1)} MB. Please upgrade your plan or delete unused files.`,
        status: 403,
      };
    }

    const HIGH_USAGE_THRESHOLD = 80;
    const FULL_USAGE_PERCENTAGE = 100;
    if (
      quotaCheck.percentageUsed > HIGH_USAGE_THRESHOLD &&
      quotaCheck.percentageUsed < FULL_USAGE_PERCENTAGE
    ) {
      logger.warn(
        {
          organizationId,
          percentageUsed: quotaCheck.percentageUsed,
          usage: quotaCheck.usage,
          quota: quotaCheck.quota,
        },
        `Storage quota is ${quotaCheck.percentageUsed}% full`
      );
    }

    return { valid: true };
  } catch (error) {
    logger.error(
      {
        organizationId,
        err: error instanceof Error ? error : new Error(String(error)),
      },
      "Failed to validate storage quota"
    );

    return {
      valid: false,
      error: "Unable to verify storage quota. Please try again later.",
      status: 503,
    };
  }
}
